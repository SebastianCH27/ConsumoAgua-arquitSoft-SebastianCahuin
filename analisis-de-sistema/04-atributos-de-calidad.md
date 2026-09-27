# Atributos de calidad

Los atributos de calidad se definen a partir de las necesidades
del sistema de consulta del consumo de agua: atender numerosos
usuarios, procesar correctamente las lecturas, integrarse con
la empresa prestadora y presentar información confiable.

## 1. Capacidad requerida

El sistema debe atender al menos 5000 usuarios activos simultáneamente
entre la aplicación móvil y la plataforma web.

Estos usuarios podrán consultar sus suministros, consumos,
costos estimados, proyecciones, historial y notificaciones,
además de utilizar las funciones de metas y reportes.

El diseño debe permitir ampliar la capacidad cuando aumente
la demanda. La cantidad máxima de usuarios soportados deberá
determinarse mediante pruebas sobre una infraestructura definida.

Esta capacidad es un requisito de diseño y validación;
todavía no representa un resultado demostrado.

## 2. Atributos y escenarios

| ID | Atributo | Escenario del sistema | Criterio de evaluación |
|---|---|---|---|
| AC01 | Rendimiento bajo concurrencia | Al menos 5000 usuarios utilizan simultáneamente las aplicaciones mientras continúan la actualización de lecturas y la evaluación de alertas. | Mantener los objetivos de respuesta y errores definidos en la sección de pruebas de carga, sin alterar los resultados de consumo, costos ni permisos de acceso. |
| AC02 | Escalabilidad | La demanda supera los 5000 usuarios simultáneos o aumenta el volumen de suministros y lecturas. | Permitir ampliar los recursos o instancias de los componentes que lo requieran. Ejecutar pruebas progresivas por encima de la carga base y documentar la capacidad alcanzada y los límites encontrados. |
| AC03 | Exactitud e integridad de la información | Se reciben lecturas repetidas, fuera de orden, corregidas o correspondientes a cambios de medidor. | Obtener los resultados esperados en los casos de prueba, evitar el doble conteo, conservar los registros originales y detectar situaciones que impidan calcular un consumo válido. |
| AC04 | Continuidad ante fallos externos | La API de la empresa deja de responder durante un periodo. | Mantener la consulta de los datos previamente almacenados, indicar su antigüedad y recuperar la actualización cuando vuelva la conexión, sin perder ni duplicar las lecturas disponibles para recuperación. |
| AC05 | Actualidad y trazabilidad | Una lectura llega tarde o se modifica la información utilizada en una estimación. | Identificar las fechas de medición y recepción, la cobertura de datos y la tarifa utilizada. Permitir rastrear las lecturas y versiones tarifarias que sustentan un cálculo. |
| AC06 | Seguridad y separación de accesos | Un usuario intenta consultar otro suministro o ejecutar funciones administrativas, incluso durante una carga elevada. | Rechazar los accesos no autorizados incluidos en las pruebas y mantener la comprobación de permisos en cada operación protegida. Proteger las comunicaciones mediante HTTPS. |
| AC07 | Interoperabilidad | La empresa utiliza formatos, unidades o identificadores diferentes a los de nuestra plataforma. | Transformar los datos de la fuente al formato interno según el contrato acordado y obtener resultados equivalentes con datos equivalentes de la fuente simulada y la integración externa. |
| AC08 | Usabilidad | Un usuario necesita entender su consumo, costo estimado, proyección y alertas. | Comprobar mediante tareas de uso que puede localizar esos datos e interpretar sus unidades, periodos y significado. Registrar dificultades y corregir las que impidan completar las tareas principales. |
| AC09 | Consistencia entre web y móvil | Se consulta el mismo suministro desde ambas aplicaciones. | Mostrar resultados equivalentes al utilizar el mismo periodo, versión de datos y parámetros. Mantener accesibles las funciones principales en los dispositivos definidos para las pruebas. |
| AC10 | Mantenibilidad | Cambia una tarifa, una regla de alerta, el método de proyección o el contrato de la API externa. | Localizar los cambios en los componentes responsables y superar las pruebas de regresión. Evitar cambios innecesarios en las interfaces o en otros módulos cuyos contratos no hayan variado. |

## 3. Evaluación de la carga de 5000 usuarios

### Usuarios concurrentes activos
La prueba representará 5000 usuarios con sesiones independientes
que ejecutan operaciones durante el mismo intervalo de tiempo.

Cada usuario virtual realizará acciones y pausas representativas
del uso de la aplicación. Se distribuirán las consultas entre
distintos suministros autorizados.

Se medirán tanto los usuarios concurrentes como las solicitudes
atendidas por segundo, ya que son medidas diferentes.

### Operaciones representadas
La carga incluirá:
- Acceso y selección de suministros.
- Consulta del resumen de consumo y costo estimado.
- Consulta de proyecciones.
- Consulta del historial y gráficos.
- Consulta y lectura de notificaciones.
- Consulta y modificación de metas.
- Solicitud y descarga de reportes.

La proporción de cada operación y las pausas entre acciones
se documentarán antes de ejecutar la prueba.

La recepción de lecturas y la evaluación de alertas se ejecutarán
también durante la prueba, con un volumen de entrada documentado.

### Metas iniciales propuestas
Para concretar la evaluación se proponen las siguientes metas:

| Indicador | Meta propuesta |
|---|---|
| Carga sostenida | 5000 usuarios activos simultáneamente durante 30 minutos, después de un incremento gradual de carga. |
| Consultas interactivas | Al menos el 95 % de las solicitudes válidas de resumen, proyección, historial y notificaciones debe responder en un máximo de 2 segundos, evaluando cada tipo de operación por separado. |
| Errores inesperados | Menos del 1 % de las solicitudes válidas de cada operación debe fallar por errores internos o tiempos de espera agotados. |
| Corrección de resultados | Cero resultados incorrectos, dobles conteos o accesos indebidos en las verificaciones realizadas. Cualquier caso detectado implica que la prueba no cumple este criterio. |

Estas metas de duración, tiempo y porcentaje de errores son propuestas
iniciales. Deberán validarse con las necesidades de uso y documentarse
antes de realizar las pruebas.

El objetivo de 2 segundos se refiere a respuestas de nuestra API
con datos disponibles en nuestra plataforma. La presentación completa
en web y móvil también se evaluará en los dispositivos seleccionados.

Los reportes tendrán un objetivo de finalización propio, definido
según su tamaño y periodo. Su generación se incluirá en la carga
para comprobar que no impida atender las consultas interactivas.

Las respuestas de rechazo esperadas, como impedir un acceso
sin autorización, se evaluarán como comportamiento funcional.
Se distinguirán de los errores inesperados del servicio.

### Pruebas por encima de la carga base
Se aumentará progresivamente la concurrencia por encima de 5000
para identificar:
- La carga a partir de la cual se incumplen los tiempos de respuesta.
- Los componentes que limitan la capacidad.
- Los recursos necesarios para atender una demanda mayor.
- El comportamiento y la recuperación después de una sobrecarga.

No se afirmará una capacidad superior sin evidencia de pruebas.

## 4. Condiciones que deben documentarse

Para que los resultados sean interpretables se registrarán:
- Recursos e instancias de la aplicación y la base de datos.
- Capacidad del entorno que genera la carga.
- Cantidad de suministros, lecturas y periodos históricos.
- Mezcla de operaciones y pausas de los usuarios virtuales.
- Distribución de usuarios entre web y móvil.
- Frecuencia y volumen de recepción de lecturas.
- Condiciones de red y comportamiento de la API simulada.
- Tiempos de respuesta, errores y solicitudes atendidas por segundo.
- Consumo de recursos y operaciones pendientes.
- Resultados de las comprobaciones de datos y permisos.

## 5. Actualización e independencia del proveedor

La rapidez de las consultas y la frecuencia de actualización
de las lecturas se evaluarán por separado.

Los usuarios consultarán la información incorporada a nuestra
plataforma. La integración actualizará las lecturas mediante
un proceso controlado, respetando las condiciones de la API externa.

La aplicación mostrará cuándo se midieron y actualizaron los datos.
La frecuencia de los medidores y de la empresa condicionará
la actualidad de la información disponible.

El uso de una fuente simulada permitirá comprobar el comportamiento
de nuestra plataforma. La integración real requerirá pruebas
adicionales con las condiciones del proveedor.

## 6. Alcance de la validación

Las pruebas de carga no reemplazan las pruebas de exactitud,
seguridad, recuperación, usabilidad y compatibilidad.

La capacidad de atender 5000 usuarios dependerá de la implementación
y de la infraestructura evaluada. Un diagrama en tres capas
por sí solo no demuestra esa capacidad.