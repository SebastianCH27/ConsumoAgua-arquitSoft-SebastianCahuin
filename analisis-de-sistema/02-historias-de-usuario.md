# Historias de usuario

Las historias de usuario describen las necesidades que atenderá
el sistema web y móvil de consulta del consumo de agua.

## Usuario del suministro

| ID | Historia de usuario |
|---|---|
| HU01 | Como usuario del suministro, quiero acceder de forma autorizada a mi información, para consultar los datos que me corresponden. |
| HU02 | Como usuario del suministro, quiero seleccionar entre los suministros que tengo vinculados, para consultar cada uno por separado. |
| HU03 | Como usuario del suministro, quiero consultar el consumo acumulado del periodo en litros y metros cúbicos, para conocer cuánta agua estoy utilizando. |
| HU04 | Como usuario del suministro, quiero conocer la fecha de la última lectura y si existen datos faltantes o retrasos de actualización, para interpretar correctamente la información mostrada. |
| HU05 | Como usuario del suministro, quiero consultar el costo acumulado estimado y la tarifa utilizada, para entender cómo se calcula mi gasto aproximado. |
| HU06 | Como usuario del suministro, quiero visualizar una proyección del consumo y del costo al finalizar el periodo, para anticipar mi posible gasto. |
| HU07 | Como usuario del suministro, quiero consultar el historial de consumo y costos estimados por periodo, para revisar cómo ha variado mi uso del agua. |
| HU08 | Como usuario del suministro, quiero visualizar gráficos y comparar periodos, para identificar aumentos o reducciones en mi consumo. |
| HU09 | Como usuario del suministro, quiero recibir alertas cuando mi consumo supere los límites establecidos, para tomar medidas oportunamente. |
| HU10 | Como usuario del suministro, quiero recibir avisos cuando se detecten patrones de consumo inusuales, para revisar si existe una situación que requiera atención. |
| HU11 | Como usuario del suministro, quiero consultar mis notificaciones y marcar las que ya leí, para llevar un seguimiento de los avisos recibidos. |
| HU12 | Como usuario del suministro, quiero establecer una meta de consumo o presupuesto y consultar mi avance, para controlar el uso del agua durante el periodo. |
| HU13 | Como usuario del suministro, quiero consultar recomendaciones de ahorro relacionadas con mi consumo, para identificar acciones que pueda aplicar en mi hogar. |
| HU14 | Como usuario del suministro, quiero descargar un reporte de un periodo seleccionado, para conservar un resumen de mi consumo y sus costos estimados. |

## Administrador de la plataforma

| ID | Historia de usuario |
|---|---|
| HU15 | Como administrador de la plataforma, quiero iniciar y cerrar sesión mediante un acceso administrativo, para utilizar las funciones de gestión según mis permisos. |
| HU16 | Como administrador de la plataforma, quiero gestionar los accesos y permisos de los usuarios, para controlar quién puede utilizar las funciones del sistema. |
| HU17 | Como administrador de la plataforma, quiero gestionar los suministros y su vinculación con usuarios autorizados, para que cada persona consulte la información que le corresponde. |
| HU18 | Como administrador de la plataforma, quiero configurar las tarifas y sus periodos de vigencia, para que las estimaciones utilicen los valores correspondientes a cada periodo. |
| HU19 | Como administrador de la plataforma, quiero configurar los criterios generales de consumo elevado y posibles anomalías, para que el sistema genere alertas con reglas definidas. |
| HU20 | Como administrador de la plataforma, quiero que el sistema incorpore automáticamente las lecturas disponibles mediante la API de la empresa prestadora, para mantener actualizada la información de los suministros. |
| HU21 | Como administrador de la plataforma, quiero supervisar las actualizaciones y revisar los errores, datos faltantes y registros rechazados, para identificar y atender problemas de integración. |
| HU22 | Como administrador de la plataforma, quiero configurar una fuente simulada en el entorno de pruebas, para comprobar el funcionamiento del sistema sin depender de una conexión real con la empresa. |

## Participación del sistema externo

El sistema de la empresa prestadora participa directamente
en HU20 al proporcionar las lecturas mediante su API.

Su disponibilidad y la calidad de los datos recibidos también
se relacionan con:
- HU04: información sobre actualización y datos faltantes.
- HU21: supervisión de la integración y sus incidencias.

Las consultas, estimaciones, comparaciones y alertas utilizan
las lecturas incorporadas mediante esta integración.

La API no se presenta como una persona que utiliza pantallas:
su intercambio de información se detallará en los requisitos
funcionales y en la arquitectura.

## Consideraciones

- Las funciones de consulta estarán disponibles en la aplicación
  móvil y en la plataforma web, utilizando las mismas reglas
  y fuentes de información.
- Los costos y las proyecciones se identificarán como estimaciones,
  no como importes oficiales ni pagos realizados.
- La detección de anomalías dependerá de la frecuencia y calidad
  de las lecturas disponibles.
- Una alerta no confirma por sí sola la existencia de una fuga.
- Los gráficos y comparaciones indicarán los periodos y las unidades
  utilizados.
- Las metas personales del usuario se distinguirán de los criterios
  generales de alerta configurados por el administrador.
- HU22 corresponde al entorno de pruebas; no reemplaza la integración
  prevista para el funcionamiento real.