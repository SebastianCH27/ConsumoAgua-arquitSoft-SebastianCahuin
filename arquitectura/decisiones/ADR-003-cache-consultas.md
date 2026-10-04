# ADR-003: Utilizar caché selectiva para las consultas de consumo

- Fecha: 2026-10-04.
- Estado: Aceptada para la propuesta arquitectónica;
  su activación y alcance se validarán mediante mediciones.
- Driver principal: DA01 — Rendimiento bajo concurrencia.
- Drivers relacionados: DA02 — Escalabilidad,
  DA05 — Protección de suministros,
  DA06 — Consistencia entre web y móvil,
  DA07 — Actualidad y trazabilidad
  y DA08 — Interpretación de estimaciones.
- Atributos relacionados: AC01, AC02, AC03, AC05, AC06 y AC09.
- Decisiones relacionadas: ADR-001 y ADR-002.

## Contexto

El sistema deberá atender al menos 5000 usuarios activos
simultáneamente mientras incorpora lecturas y evalúa alertas.

Las consultas de resumen, historial, gráficos y proyecciones
pueden solicitar repetidamente resultados correspondientes
al mismo suministro, periodo y conjunto de datos.

Repetir consultas o cálculos costosos podría aumentar
el tiempo de respuesta y la carga de la base de datos.

Sin embargo, las lecturas pueden llegar fuera de orden,
ser corregidas o completar periodos previamente incompletos.
También pueden cambiar las tarifas y los parámetros de cálculo.

La información pertenece a suministros protegidos.
Cualquier optimización deberá conservar los controles de acceso
y la trazabilidad de los resultados.

## Decisión

Se propone utilizar caché selectiva en el backend para resultados
de consulta cuya reutilización aporte una mejora comprobable.

Se aplicará el patrón cache-aside: la aplicación consultará
la caché y, cuando no encuentre un resultado válido,
obtendrá la información de la persistencia propia
y almacenará temporalmente el resultado reutilizable.

La base de datos propia conservará la información persistente
y las referencias necesarias para verificar cada resultado.

Cuando existan varias instancias de la API, se utilizará
una caché compartida para los resultados seleccionados.

La tecnología concreta, capacidad y tiempos de expiración
se definirán durante la implementación y las pruebas.

## Consultas candidatas

| Consulta | Condiciones para reutilizar el resultado |
|---|---|
| Resumen de consumo y costo estimado | Mismo suministro, periodo, versiones de datos y tarifas aplicables. |
| Historial y comparaciones | Mismos periodos, cobertura, parámetros y versiones de resultados. |
| Gráficos de consumo | Mismo suministro, intervalo, resolución y versión de datos. |
| Proyección de consumo y costo | Mismos datos, método, parámetros, tarifas y fecha de referencia del cálculo. |

No se almacenará automáticamente toda respuesta de la API.

Se priorizarán las consultas frecuentes cuyo costo justifique
el uso de caché. Si una consulta cambia constantemente
o presenta poca reutilización, podrá acceder directamente
a la persistencia.

## Identificación de resultados

Las claves deberán distinguir, según la operación:

- Entorno de ejecución.
- Tipo de consulta.
- Suministro.
- Periodo o intervalo solicitado.
- Unidades y resolución.
- Versión del conjunto de datos utilizado.
- Versiones tarifarias aplicables.
- Método, parámetros y fecha de referencia del cálculo.
- Versión de las reglas que afectan al resultado.

Cuando una respuesta incluya información personalizada,
también deberá distinguir al usuario y los parámetros personales.

Una consulta de otro suministro, periodo o versión
no podrá reutilizar la misma entrada.

Las claves utilizarán identificadores internos.
No incluirán nombres, direcciones, contraseñas o credenciales.

## Autorización antes de consultar la caché

Cada solicitud deberá comprobar en el backend:

1. La identidad y sesión del solicitante.
2. Los permisos correspondientes a la operación.
3. La autorización vigente sobre el suministro solicitado.

Estas comprobaciones se realizarán antes de devolver
información almacenada en caché.

Compartir una caché entre instancias del backend no convierte
los datos de los suministros en información pública.

La caché no almacenará contraseñas, credenciales del proveedor
ni decisiones de autorización como sustituto de su comprobación.

Las respuestas con información protegida no se almacenarán
en cachés públicas de intermediarios.

El acceso técnico a la caché quedará limitado
a los componentes autorizados del backend.

## Flujo de consulta

1. Comprobar identidad y autorización sobre el suministro.
2. Obtener de la persistencia la referencia de resultados
   aplicable a la consulta y su estado de actualización.
3. Construir una clave con el suministro, parámetros
   y versiones correspondientes.
4. Consultar la caché.
5. Si existe una entrada compatible, utilizarla.
6. Si no existe, obtener o calcular el resultado
   con los datos de esa versión.
7. Almacenar el resultado reutilizable y devolverlo
   con su información de trazabilidad.

La comprobación de versiones deberá ser una operación acotada.
Su costo se incluirá en las mediciones de rendimiento.

Una entrada antigua no se considerará vigente únicamente
porque todavía no haya expirado.

## Actualización e invalidación

Los cambios se confirmarán primero en la persistencia.

Después se invalidarán las entradas afectadas o se publicará
una nueva referencia de versión que impida reutilizar
los resultados anteriores como actuales.

Se considerarán, como mínimo, los siguientes cambios:

- Incorporación de nuevas lecturas.
- Corrección o recuperación de lecturas anteriores.
- Identificación de cambios o reinicios de medidor.
- Modificación de periodos o parámetros de cálculo.
- Cambios en tarifas y sus fechas de aplicación.
- Actualización de métodos de proyección.

El alcance dependerá del cambio. Una tarifa modificada
podrá afectar resultados de varios suministros y periodos.

Los resultados se publicarán de manera coherente,
evitando combinar un consumo de una versión con un costo
o una proyección calculados sobre otra.

Cuando una actualización todavía requiera reprocesamiento,
se informará el estado correspondiente. Un resultado anterior
no se presentará como si ya incorporara la corrección pendiente.

## Consultas y actualizaciones simultáneas

Un cálculo conservará la referencia de versión
con la que comenzó.

Si durante su ejecución se publica una versión posterior,
el resultado anterior solamente podrá guardarse
bajo la clave de su propia versión.

Ese cálculo no podrá reemplazar la referencia vigente
ni sobrescribir resultados de la versión posterior.

La implementación deberá comprobar este comportamiento
cuando coincidan consultas y trabajos de actualización.

## Expiración y trazabilidad

Cada tipo de entrada tendrá un tiempo máximo de permanencia.

Los valores se definirán considerando:

- Frecuencia de las lecturas.
- Frecuencia de cambios tarifarios.
- Reutilización observada de las consultas.
- Necesidades de actualidad.
- Capacidad de almacenamiento.

La expiración limitará la conservación de entradas,
pero no sustituirá el control de versiones ni la invalidación.

Los resultados conservarán sus fechas de medición y cálculo,
cobertura de datos y referencias a tarifas y parámetros.

El estado actual de integración se obtendrá de la persistencia.
La caché no deberá ocultar una interrupción del proveedor
ni presentar un periodo incompleto como completo.

## Operaciones que utilizarán la persistencia vigente

Las siguientes operaciones no dependerán de resultados
almacenados en la caché de consultas:

- Comprobación de permisos y vinculaciones con suministros.
- Validación, incorporación y corrección de lecturas.
- Control de duplicados y recuperación de trabajos.
- Evaluación y registro de alertas.
- Cambios en metas y configuraciones.
- Registro y consulta del estado de lectura de notificaciones.
- Modificación de tarifas y parámetros.

Los reportes deberán identificar y comprobar la versión
que utilizan. No se generarán a partir de una respuesta
almacenada cuya vigencia no haya sido verificada.

## Ubicación en Clean Architecture

Aplicación determinará las condiciones de reutilización
y utilizará un contrato de caché definido en esa parte del núcleo.

Infraestructura implementará el acceso al almacenamiento
de caché y sus operaciones técnicas.

Dominio conservará las reglas de consumo, tarifas y proyecciones
sin depender de una herramienta de caché.

La configuración conectará los casos de uso con el adaptador
seleccionado, conforme a ADR-002.

## Comportamiento ante fallos

Si la caché no está disponible, las consultas recurrirán
a la persistencia propia cuando sea posible.

Se limitarán los tiempos de espera y se registrará
la incidencia.

La pérdida de la caché no provocará la pérdida de lecturas,
tarifas, alertas o resultados persistentes.

Si no puede comprobarse la autorización o la versión aplicable,
no se devolverá una entrada de caché como resultado vigente.

La mayor carga sobre la base de datos durante un fallo
deberá evaluarse. El sistema necesitará límites y control
de concurrencia para evitar consultas o cálculos repetidos
sin control.

La capacidad de 5000 usuarios durante ese escenario
deberá medirse por separado.

## Alternativas consideradas

| Alternativa | Evaluación |
|---|---|
| Consultar siempre la persistencia sin caché | Simplifica la operación y será la referencia para medir si la optimización aporta beneficios. |
| Mantener cachés independientes en cada instancia | Reduce el acceso local, pero requiere coordinar varias copias cuando cambian los datos. |
| Utilizar caché compartida, selectiva y con versiones | Permite reutilizar resultados entre instancias y controlar su correspondencia con los datos. Es la alternativa propuesta. |

## Justificación

La decisión busca reducir trabajo repetido en consultas
relacionadas con DA01 y facilitar la ampliación prevista
en DA02.

Los controles de autorización responden a DA05.

Las versiones y la información de actualización permiten
mantener la coherencia entre web y móvil y conservar
la interpretación de los resultados, conforme a DA06,
DA07 y DA08.

La selección final de consultas dependerá de sus beneficios
medidos y del costo de mantenerlas actualizadas.

## Consecuencias favorables

- Posible reducción del tiempo de respuesta.
- Menor repetición de consultas y cálculos costosos.
- Reutilización de resultados entre instancias.
- Control explícito de las versiones utilizadas.
- Conservación de la persistencia como fuente principal.

## Compromisos y condiciones

- Mayor complejidad de configuración y supervisión.
- Consumo adicional de memoria o almacenamiento.
- Necesidad de comprobar versiones e invalidar entradas.
- Protección de los datos almacenados temporalmente.
- Posible aumento de carga cuando la caché falle.
- Beneficio limitado cuando exista poca reutilización.

La caché no demuestra por sí sola que el sistema
pueda atender 5000 usuarios simultáneos.

## Verificación prevista

Se comparará el funcionamiento con y sin caché
utilizando la misma infraestructura y carga.

Se medirán tiempos de respuesta, errores, carga de la base
de datos, reutilización de entradas y consumo de recursos.

También se comprobarán escenarios de:

- Solicitudes de suministros no autorizados.
- Revocación de permisos después de almacenar resultados.
- Nuevas lecturas y correcciones de periodos anteriores.
- Cambios tarifarios y reprocesamiento.
- Consultas simultáneas con una actualización.
- Expiración y pérdida de entradas.
- Interrupción de la caché y recuperación.
- Resultados equivalentes entre web y móvil.
- Diferencias de usuario, periodo, unidades y parámetros.
- Proyecciones cuya fecha de referencia haya cambiado.

La prueba de capacidad seguirá los criterios definidos
en AC01, incluyendo la incorporación de lecturas
y la evaluación de alertas.

En esta etapa se documenta la estrategia.
Su implementación y verificación están pendientes.

## Referencias técnicas

- Microsoft Learn: [Patrón Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).
- Microsoft Learn: [Guía de almacenamiento en caché](https://learn.microsoft.com/en-us/azure/architecture/best-practices/caching).