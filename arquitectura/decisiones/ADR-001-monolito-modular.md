# ADR-001: Backend modular con procesos de actualización separados

- Fecha: 2026-10-04
- Estado: Aceptada para la propuesta arquitectónica.
- Drivers principales: DA01 — Rendimiento bajo concurrencia,
  DA02 — Escalabilidad y DA12 — Mantenibilidad.
- Drivers relacionados: DA03 — Integridad de lecturas,
  DA04 — Integración y continuidad y DA10 — Generación de reportes.
- Atributos relacionados: AC01, AC02, AC03, AC04, AC09 y AC10.

## Contexto

El sistema proporcionará una aplicación móvil y una plataforma web
para consultar consumos, costos estimados, proyecciones, historial,
alertas, metas y reportes.

Ambas interfaces utilizarán un backend común y permitirán consultar
únicamente los suministros autorizados para cada usuario.

Las lecturas procederán del sistema de la empresa prestadora mediante
una API autorizada. Su incorporación requerirá validación, control
de duplicados, cálculos y evaluación de alertas.

El sistema deberá atender al menos 5000 usuarios activos
simultáneamente entre web y móvil mientras continúan esos trabajos.

Por ello, es necesario organizar las responsabilidades y controlar
los recursos utilizados por las consultas y las actualizaciones.

## Decisión

Se organizará el backend como un monolito modular, con responsabilidades
e interfaces definidas entre sus módulos.

La misma base de código podrá ejecutarse mediante procesos dedicados
a atender la API y procesos trabajadores dedicados a las actualizaciones.
Ambos reutilizarán las reglas y los casos de uso correspondientes.

Esta organización permitirá asignar recursos a cada tipo de ejecución
sin desarrollar versiones distintas de las reglas del negocio.

Los módulos mantendrán una gestión conjunta de su código y versiones.
Las interfaces web y móvil se comunicarán con el backend mediante
la API REST propia, conforme a RC03.

## Organización funcional

| Módulo | Responsabilidades principales | Requisitos relacionados |
|---|---|---|
| Acceso y suministros | Identidad, sesiones, roles, permisos, suministros autorizados, vinculaciones y configuración de periodos. | RF01–RF04 y RF30–RF32. |
| Lecturas, consumo e historial | Integración, validación, duplicados, cálculo de consumo, cobertura de datos, historial, gráficos, comparaciones y supervisión. | RF05–RF14, RF19–RF21 y RF35–RF39. |
| Tarifas, costos y proyecciones | Configuración y vigencia de tarifas, estimaciones económicas, proyecciones y trazabilidad de sus resultados. | RF15–RF18 y RF33. |
| Alertas, notificaciones y metas | Evaluación de condiciones, registro de avisos, estado de lectura y seguimiento de metas. | RF22–RF27 y RF34. |
| Reportes y recomendaciones | Preparación de reportes y selección de recomendaciones de ahorro mediante reglas. | RF28 y RF29. |

Cada módulo será responsable de sus operaciones y de la información
que administra. La colaboración utilizará interfaces internas
y respetará los límites definidos.

La administración y supervisión utilizarán las operaciones protegidas
de estos módulos.

## Distribución de la ejecución

### Atención de solicitudes

Los procesos de la API atenderán las consultas y operaciones
de los usuarios, comprobando identidad, rol y autorización
sobre el suministro solicitado.

Las consultas utilizarán los datos incorporados a nuestra plataforma.
Una consulta del usuario no iniciará automáticamente una nueva
sincronización con la empresa prestadora.

Podrán ejecutarse varias instancias de la API y distribuirse
las solicitudes mediante un balanceador de carga.

### Actualización y procesamiento

Los trabajadores ejecutarán las tareas de incorporación de lecturas,
validación, cálculo, actualización de resultados y evaluación de alertas.

El mecanismo de obtención de lecturas dependerá del contrato
del proveedor. Podrá utilizar consultas programadas o recepción
de eventos según las operaciones realmente disponibles.

Si la empresa proporciona eventos, su entrada deberá verificarlos
y registrar el trabajo necesario para su procesamiento.

La cantidad de trabajadores y sus recursos se determinarán
según el volumen de lecturas y los resultados de las pruebas.

### Reportes

La generación de reportes tendrá límites de tamaño y recursos
para proteger las consultas interactivas.

Si las pruebas justifican generación diferida, deberán definirse
las funciones para consultar el estado y descargar el resultado,
actualizando los requisitos antes de implementar ese comportamiento.

## Datos compartidos y consistencia

La plataforma utilizará almacenamiento propio para conservar
lecturas, tarifas, autorizaciones, resultados y estados de trabajo.

Las instancias de la API y los trabajadores accederán a esa información
mediante los componentes de acceso a datos correspondientes.

Se deberán cumplir las siguientes condiciones:

- Conservar el estado de las tareas para recuperarlas tras una interrupción.
- Coordinar los trabajos sobre un mismo suministro.
- Evitar contabilizar nuevamente lecturas repetidas.
- Conservar los originales y la relación de las correcciones.
- Identificar las versiones de lecturas, tarifas y parámetros utilizados.
- Publicar resultados coherentes de consumo, costos y proyecciones.
- Controlar los avisos duplicados durante los reintentos.
- Mantener las sesiones y autorizaciones compatibles con varias instancias.

El mecanismo de coordinación y persistencia se seleccionará
durante el diseño técnico y la implementación.

## Alternativas consideradas

| Alternativa | Evaluación |
|---|---|
| Monolito modular con un único proceso de ejecución | Simplifica la operación inicial, pero concentra la atención de usuarios y los trabajos de actualización en los mismos recursos del proceso. |
| Monolito modular con procesos de API y trabajadores | Permite reutilizar las reglas y controlar los recursos de consultas y actualización por separado. Es la alternativa seleccionada. |
| Microservicios con despliegues independientes | Permiten organizar y ampliar servicios por separado, pero añaden comunicación por red, coordinación distribuida y gestión de versiones entre servicios. En esta etapa no se ha justificado esa separación por módulo. |

## Justificación

La decisión responde a DA01 porque permite controlar los recursos
utilizados por las consultas y por los trabajos de actualización.

Responde a DA02 porque permite ampliar las instancias de la API
o los trabajadores según el componente que limite la capacidad.

Responde a DA12 porque mantiene módulos delimitados y una base
común de reglas, facilitando cambios y pruebas.

También contribuye a DA04: durante una interrupción del proveedor,
los usuarios podrán consultar la información previamente incorporada,
con sus fechas y estados de actualización.

## Consecuencias favorables

- Reglas comunes para web, móvil y procesos de actualización.
- Responsabilidades identificables por módulo.
- Posibilidad de ampliar la API y los trabajadores por separado.
- Recuperación de trabajos mediante estados persistentes.
- Posibilidad de probar módulos y verificar después su colaboración.

## Compromisos y condiciones

- Los módulos mantendrán una gestión conjunta de versiones.
- Será necesario coordinar los procesos que comparten información.
- La base de datos podrá limitar la capacidad aunque se añadan instancias.
- La separación de procesos añadirá tareas de configuración y supervisión.
- Deberán evitarse diferencias de reglas entre versiones de API
  y trabajadores durante los despliegues.
- La capacidad dependerá de la implementación, los datos
  y la infraestructura evaluada.

## Verificación prevista

Se revisarán las responsabilidades y dependencias entre módulos.

Las pruebas incluirán consultas simultáneas mientras se incorporan
lecturas, se calculan resultados y se evalúan alertas.

Se comprobarán duplicados, correcciones, interrupciones de trabajadores
y recuperación de tareas, verificando cálculos y permisos.

Se utilizarán las metas propuestas en AC01:

- 5000 usuarios activos simultáneamente durante 30 minutos,
  después de un incremento gradual.
- Al menos el 95 % de las solicitudes válidas de resumen,
  proyección, historial y notificaciones responderá
  en un máximo de 2 segundos por tipo de operación.
- Menos del 1 % de errores inesperados por operación.
- Cero resultados incorrectos, dobles conteos o accesos indebidos
  en las verificaciones realizadas.

La duración, los tiempos y el porcentaje de errores deberán
validarse antes de ejecutar las pruebas.

Posteriormente se incrementará la carga para identificar los límites
y evaluar las ampliaciones necesarias.

La selección de esta arquitectura constituye una decisión de diseño.
La capacidad de 5000 usuarios permanece pendiente de demostración.