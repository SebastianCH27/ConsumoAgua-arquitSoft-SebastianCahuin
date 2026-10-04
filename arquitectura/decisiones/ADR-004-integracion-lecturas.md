# ADR-004: Integrar las fuentes de lecturas mediante contratos y adaptadores

- Fecha: 2026-10-04.
- Estado: Aceptada para la propuesta arquitectónica.
  La integración real depende del acuerdo con la empresa prestadora.
- Driver principal: DA04 — Integración y continuidad ante fallos externos.
- Drivers relacionados: DA03 — Integridad de lecturas,
  DA07 — Actualidad y trazabilidad,
  DA11 — Sustitución de la fuente simulada
  y DA12 — Mantenibilidad.
- Atributos relacionados: AC03, AC04, AC05, AC06, AC07 y AC10.
- Requisitos relacionados: RF05–RF09, RF13, RF14 y RF35–RF39.
- Restricciones relacionadas: RC04, RC05, RC06 y RC07.
- Decisiones relacionadas: ADR-001, ADR-002 y ADR-003.

## Contexto

Los medidores automáticos enviarán sus registros al sistema
de la empresa prestadora.

Nuestra plataforma obtendrá las lecturas mediante una API
autorizada de esa empresa.

El proyecto no accederá directamente a los medidores
ni a la base de datos de la empresa.

Todavía deben confirmarse las operaciones disponibles,
los formatos, los identificadores, la frecuencia,
los límites de uso y las condiciones de recuperación.

Durante el desarrollo se utilizará una fuente simulada
para verificar el comportamiento del sistema.

Las reglas de consumo, tarifas, proyecciones y alertas
deberán conservarse cuando cambie la implementación
de la fuente de información.

## Decisión

Se definirá un contrato interno de intercambio de lecturas
y se separarán los detalles del proveedor mediante adaptadores.

Los contratos requeridos por los casos de uso se ubicarán
en Aplicación y utilizarán tipos del dominio,
conforme a ADR-002.

Infraestructura contendrá las implementaciones concretas
para la integración real y la simulación.

La configuración seleccionará la implementación
correspondiente al entorno.

El contrato interno describirá las necesidades de nuestra
aplicación. Su correspondencia con la API externa deberá
comprobarse antes de habilitar datos reales.

Si la empresa no proporciona información indispensable,
se revisarán los requisitos y capacidades afectadas.
No se inventarán datos para completar una lectura.

## Distribución de responsabilidades

| Elemento | Responsabilidad |
|---|---|
| Contratos en Aplicación | Definir los datos, operaciones y resultados de integración que necesitan los casos de uso. |
| Adaptador real en Infraestructura | Resolver la comunicación, autenticación técnica y transformación de los formatos del proveedor. |
| Fuente simulada en Infraestructura | Proporcionar escenarios controlados con datos ficticios y comportamientos de fallo. |
| Casos de uso en Aplicación | Coordinar validación, incorporación, duplicados, persistencia, reprocesamiento y supervisión. |
| Reglas del Dominio | Determinar compatibilidad de lecturas, unidades y condiciones para calcular consumos y resultados. |

El adaptador real no contendrá las reglas de estimación
económica o de evaluación de alertas.

Una transformación de formato no sustituirá la validación
de negocio realizada por el núcleo.

## Información del intercambio interno

El diseño considerará los siguientes datos:

| Información | Finalidad |
|---|---|
| Fuente y entorno | Identificar la procedencia y separar pruebas de producción. |
| Identificador del registro y revisión, cuando existan | Reconocer repeticiones y correcciones según el contrato acordado. |
| Suministro y medidor, cuando corresponda | Asociar la lectura y comprobar la continuidad de las mediciones. |
| Fecha de medición y zona horaria | Ordenar e interpretar los registros. |
| Valor, unidad y tipo de medición | Distinguir lecturas acumuladas de consumos por intervalo. |
| Inicio y fin del intervalo, cuando corresponda | Comprobar cobertura y evitar superposiciones. |
| Información de corrección o cambio de medidor | Conservar trazabilidad y evitar cálculos incompatibles. |
| Fecha de recepción | Registrar cuándo nuestra plataforma recibió la información. |

La fecha de recepción será registrada por nuestra plataforma.

Se conservarán los valores y unidades originales necesarios
para interpretar la lectura, además de su representación interna.

Las fechas tendrán una interpretación explícita.
No se supondrá una zona horaria si el contrato no permite
determinarla correctamente.

La disponibilidad de estos campos deberá acordarse
con la empresa. No se afirma que una API existente
ya los proporcione todos.

## Mecanismo de actualización

Se adoptará el mecanismo autorizado por la empresa.

### Si permite consultas periódicas

La aplicación utilizará un contrato de salida para solicitar
las lecturas disponibles.

El adaptador real y la fuente simulada implementarán
ese mismo contrato para los escenarios correspondientes.

Los trabajadores organizarán las consultas respetando
frecuencias, paginación y límites confirmados.

### Si permite envío de eventos

Un adaptador de entrada verificará la comunicación recibida
y entregará los registros al caso de uso de incorporación.

La simulación podrá generar eventos equivalentes
para probar ese mecanismo.

La confirmación de recepción deberá coordinarse
con el registro duradero de la información,
según las reglas del proveedor.

No se obligará a la integración a implementar ambas modalidades.

La selección del mecanismo no trasladará las reglas
de consumo y estimación a los adaptadores.

## Incorporación de lecturas

El procesamiento seguirá estas responsabilidades:

1. Obtener o recibir registros mediante el mecanismo autorizado.
2. Transformar el formato externo al formato interno.
3. Comprobar campos, unidades, valores y correspondencia
   con suministros reconocidos por la integración.
4. Identificar repeticiones, correcciones y registros
   que requieran revisión.
5. Conservar las lecturas incorporadas y las incidencias
   o rechazos con su motivo.
6. Actualizar los cálculos afectados y evaluar las reglas
   cuando existan datos suficientes.
7. Registrar el avance y el estado del trabajo.
8. Publicar resultados coherentes y aplicar el control
   de versiones de caché establecido en ADR-003.

Las consultas de los usuarios utilizarán los datos
incorporados a la persistencia propia.

Cada consulta del usuario no provocará una solicitud
a la API de la empresa.

## Duplicados, correcciones y registros fuera de orden

La identificación de duplicados se basará preferentemente
en identificadores estables proporcionados por la fuente.

Si no existen, deberá acordarse y comprobarse una estrategia
de identificación que distinga registros legítimos
de retransmisiones.

Un registro con una revisión o valor corregido
no se descartará automáticamente como duplicado.

Las correcciones conservarán su relación con la información
anterior y provocarán la revisión de los resultados afectados.

Los registros fuera de orden se incorporarán según
sus fechas y relaciones, respetando las reglas del dominio.

La fecha de la última medición no será suficiente,
por sí sola, para asegurar que se recibieron todas
las lecturas o correcciones anteriores.

## Continuidad y recuperación

Ante una interrupción del proveedor:

- Se conservarán las consultas sobre información almacenada.
- Se mostrarán las fechas y el estado de actualización.
- Se registrará la incidencia.
- Se aplicarán reintentos controlados cuando corresponda.
- Se recuperarán registros pendientes si la fuente lo permite.

Los reintentos respetarán los límites del proveedor
y tendrán tiempos de espera y cantidades acotadas.

Los errores temporales se distinguirán de problemas
de credenciales, permisos o datos inválidos.

Un problema de autorización no provocará reintentos
indefinidos sin intervención.

El avance de procesamiento se conservará en la persistencia.
No se considerará completado un registro cuyo tratamiento
todavía no haya quedado almacenado de forma duradera.

Cuando existan cursores o páginas, se precisará cómo registrar
su avance sin perder datos ante una interrupción.

Si la empresa no permite recuperar cierta información,
se señalará la cobertura incompleta del periodo.

En producción, un fallo de la fuente real no provocará
el cambio automático a datos simulados.

## Seguridad y límites de acceso

El adaptador real utilizará únicamente operaciones
y suministros autorizados por la empresa.

La autenticación técnica de la integración será distinta
de la sesión de los usuarios de nuestra plataforma.

Las credenciales se gestionarán mediante configuración
protegida. No se incluirán en el código, los commits
o los registros de incidencias.

La comunicación real utilizará un canal seguro
según el contrato del proveedor.

Si existen eventos entrantes, deberá verificarse
su autenticidad mediante el mecanismo acordado.

Los controles de acceso de nuestra API seguirán comprobando
el rol y la autorización del usuario sobre cada suministro.

Recibir una lectura no concederá automáticamente
a cualquier usuario permiso para consultarla.

## Fuente simulada y separación de entornos

La fuente simulada utilizará suministros, identidades
y lecturas ficticias.

Permitirá reproducir escenarios definidos y obtener
resultados esperados comprobables.

Se contemplarán escenarios de:

- Lecturas normales.
- Consumo elevado.
- Datos faltantes.
- Registros duplicados.
- Lecturas fuera de orden.
- Correcciones.
- Cambios o reinicios de medidor.
- Unidades distintas.
- Datos inválidos.
- Interrupciones y recuperación de conexión.

Los entornos de prueba y producción tendrán configuraciones
y almacenamiento separados.

La configuración productiva impedirá utilizar
la fuente simulada como origen de lecturas reales.

Las pruebas del simulador comprobarán el comportamiento
de nuestra aplicación. No demostrarán por sí solas
la compatibilidad con la API de la empresa.

## Sustitución por la integración real

Antes de habilitar el adaptador real se deberá:

1. Confirmar autorización y contrato externo.
2. Verificar las transformaciones de datos.
3. Comprobar identificadores, fechas, unidades y correcciones.
4. Probar los límites y mecanismos de recuperación.
5. Ejecutar las pruebas del contrato y de integración.
6. Comparar resultados sobre conjuntos de datos equivalentes.
7. Revisar la configuración y separación de entornos.

Los datos equivalentes deberán producir resultados
equivalentes en el núcleo.

El cambio requerirá configurar y verificar el adaptador.
Si cambian las capacidades del intercambio, también
podrá requerir revisar contratos y requisitos afectados.

## Alternativas consideradas

| Alternativa | Evaluación |
|---|---|
| Utilizar directamente el cliente del proveedor dentro de los casos de uso | Vincula el procesamiento con formatos y detalles externos. Dificulta la simulación y los cambios de integración. |
| Trabajar únicamente con datos simulados | Permite desarrollar y demostrar escenarios, pero no satisface el funcionamiento real previsto. |
| Separar contratos y adaptadores para la integración real y simulada | Permite mantener las reglas del núcleo y verificar cada implementación. Es la alternativa seleccionada. |

## Justificación

La separación responde a DA04 al concentrar la comunicación
externa y permitir consultar datos propios durante interrupciones.

Los controles de repetición, corrección y recuperación
responden a DA03.

Las fechas, cobertura y estados de integración contribuyen
a DA07.

La simulación y la sustitución controlada de implementaciones
responden a DA11.

La delimitación de contratos y responsabilidades facilita
el mantenimiento previsto en DA12.

## Consecuencias favorables

- Reglas independientes del formato del proveedor.
- Pruebas reproducibles mediante datos ficticios.
- Integración externa concentrada en componentes específicos.
- Continuidad de consultas sobre datos almacenados.
- Tratamiento explícito de duplicados, correcciones y pendientes.

## Compromisos y condiciones

- Será necesario mantener contratos y transformaciones.
- La integración real dependerá de capacidades externas.
- La simulación deberá representar los escenarios relevantes.
- Los cambios del proveedor pueden exigir actualizar el adaptador.
- La recuperación estará limitada por los datos disponibles.
- La separación no elimina la necesidad de controlar
  persistencia y concurrencia.

## Verificación prevista

Se probarán los casos de uso con la fuente simulada
y se comprobarán resultados e incidencias esperados.

Se verificará que un reintento no duplique consumos
y que una corrección conserve su trazabilidad.

También se comprobarán interrupciones durante la incorporación,
recuperación del trabajo y publicación coherente de resultados.

Las pruebas del adaptador real verificarán el cumplimiento
del contrato autorizado de la empresa.

Durante las pruebas de carga se mantendrán las actualizaciones
y la evaluación de alertas, conforme a AC01 y ADR-001.

Los 5000 usuarios no se traducirán automáticamente
en 5000 solicitudes simultáneas al proveedor.

En esta etapa se documenta la decisión.
La implementación y las verificaciones del sistema de agua
están pendientes.

## Referencia técnica

- Alistair Cockburn: [Arquitectura de puertos y adaptadores](https://alistair.cockburn.us/hexagonal-architecture).