# Requisitos funcionales

Los requisitos funcionales describen las operaciones que debe realizar
el sistema web y móvil de consulta del consumo de agua.

Se organizan por procesos y se relacionan con las historias de usuario.
La aplicación móvil y la plataforma web compartirán las reglas
de negocio del backend.

## 1. Acceso y selección del suministro

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF01 | El sistema debe verificar la identidad y autorización del usuario antes de permitirle consultar información de suministros reales. | HU01 |
| RF02 | El sistema debe permitir iniciar y cerrar sesiones de consulta y sesiones administrativas, diferenciando sus permisos. | HU01, HU15 |
| RF03 | El sistema debe comprobar en cada operación protegida el rol del usuario y su autorización sobre el suministro solicitado. | HU01, HU15, HU16 |
| RF04 | El sistema debe mostrar los suministros autorizados del usuario y permitir seleccionar cuál desea consultar. | HU02 |

## 2. Integración y actualización de lecturas

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF05 | El sistema debe obtener automáticamente las lecturas disponibles mediante la API autorizada de la empresa, según el mecanismo y la frecuencia de intercambio acordados. | HU20 |
| RF06 | El sistema debe registrar las lecturas recibidas con su suministro, identificación del medidor cuando corresponda, fecha de medición, valor, unidad, tipo de medición, fuente y fecha de recepción. | HU20 |
| RF07 | El sistema debe validar los campos requeridos, las unidades, los valores y la correspondencia del suministro antes de incorporar una lectura a los cálculos, conservando el motivo de rechazo cuando no sea válida. | HU20, HU21 |
| RF08 | El sistema debe detectar registros ya recibidos y evitar que una misma lectura se contabilice más de una vez. | HU20, HU21 |
| RF09 | El sistema debe registrar los fallos de comunicación y permitir recuperar las lecturas pendientes cuando se restablezca la conexión, sin duplicar registros. | HU20, HU21 |

## 3. Cálculo y consulta del consumo

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF10 | El sistema debe calcular el consumo según el tipo de dato recibido: mediante diferencias entre lecturas acumuladas compatibles o mediante la agregación de consumos de intervalos no superpuestos. | HU03 |
| RF11 | El sistema debe normalizar las unidades y permitir consultar el consumo en litros y metros cúbicos. | HU03 |
| RF12 | El sistema debe mostrar el consumo del periodo seleccionado junto con las fechas que delimitan los datos utilizados. | HU03, HU04 |
| RF13 | El sistema debe identificar información faltante, lecturas incompatibles o interrupciones de actualización, y señalar cuándo el consumo del periodo está incompleto o no puede calcularse. | HU04 |
| RF14 | El sistema debe mostrar la fecha de la última lectura y el estado de la última actualización de cada suministro. | HU04 |

## 4. Estimación de costos y proyecciones

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF15 | El sistema debe calcular el costo acumulado estimado utilizando el consumo disponible y las tarifas aplicables al suministro y al periodo correspondiente. | HU05 |
| RF16 | El sistema debe mostrar el importe estimado, el consumo utilizado, la tarifa aplicada y los conceptos incluidos en el cálculo. | HU05 |
| RF17 | El sistema debe proyectar el consumo al finalizar el periodo mediante un método definido y calcular su costo estimado aplicando las tarifas correspondientes. | HU06 |
| RF18 | El sistema debe mostrar la fecha de cálculo y los supuestos de la proyección, e informar cuando no existan datos suficientes para generarla. | HU06 |

## 5. Historial, gráficos y comparaciones

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF19 | El sistema debe permitir consultar periodos anteriores de un suministro, mostrando su consumo, costo estimado y cobertura de datos. | HU07 |
| RF20 | El sistema debe permitir comparar periodos, mostrando sus fechas, duración y diferencias de consumo y costo estimado. | HU08 |
| RF21 | El sistema debe representar la evolución del consumo mediante gráficos cuya resolución corresponda a las lecturas disponibles, identificando los intervalos sin datos. | HU07, HU08 |

## 6. Alertas y notificaciones

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF22 | El sistema debe evaluar el consumo frente a los límites configurados y generar alertas cuando se cumplan las condiciones establecidas. | HU09 |
| RF23 | El sistema debe evaluar patrones de consumo según las reglas de anomalías configuradas y generar avisos únicamente cuando existan datos suficientes para aplicar esas reglas. | HU10 |
| RF24 | El sistema debe registrar cada aviso con su suministro, fecha, motivo y condición detectada, evitando notificaciones duplicadas del mismo evento. | HU09, HU10, HU11 |
| RF25 | El sistema debe permitir consultar las notificaciones de los suministros autorizados, distinguir las pendientes y marcarlas como leídas. | HU11 |

## 7. Metas, recomendaciones y reportes

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF26 | El sistema debe permitir crear, modificar y desactivar metas personales de consumo o presupuesto para un suministro y periodo definidos. | HU12 |
| RF27 | El sistema debe mostrar el avance respecto a la meta, el valor restante o excedido y una advertencia cuando se alcance o supere el límite. | HU09, HU12 |
| RF28 | El sistema debe mostrar recomendaciones de ahorro seleccionadas mediante reglas relacionadas con el consumo, las comparaciones o las alertas disponibles. | HU13 |
| RF29 | El sistema debe permitir descargar un reporte del suministro y periodo seleccionados con consumo, costos estimados, gráficos disponibles, fecha de generación y observaciones sobre datos incompletos. | HU14 |

## 8. Administración de accesos y suministros

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF30 | El sistema debe permitir al administrador crear, actualizar, activar y desactivar accesos de usuario y asignar los roles definidos. | HU16 |
| RF31 | El sistema debe permitir al administrador registrar y actualizar los suministros reconocidos por la integración, y gestionar su vinculación con usuarios autorizados. | HU17 |
| RF32 | El sistema debe permitir configurar las fechas de los periodos de consumo de los suministros, para organizar las consultas, metas, cálculos y comparaciones. | HU17 |

## 9. Administración de tarifas y criterios de alerta

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF33 | El sistema debe permitir registrar y actualizar configuraciones tarifarias, incluyendo su aplicación por suministro, unidad, componentes, tramos cuando correspondan y fechas de vigencia, conservando las versiones utilizadas en estimaciones anteriores. | HU18 |
| RF34 | El sistema debe permitir configurar y activar o desactivar criterios generales de consumo elevado y anomalías, indicando sus umbrales, ventanas de evaluación y datos mínimos requeridos. | HU19 |

## 10. Supervisión de la integración

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF35 | El sistema debe permitir al administrador consultar el estado de la integración y la última actualización recibida por suministro. | HU21 |
| RF36 | El sistema debe registrar y mostrar las incidencias de integración con su fecha, suministro cuando sea identificable, motivo y estado de atención. | HU21 |
| RF37 | El sistema debe permitir al administrador solicitar un nuevo intento de actualización o reprocesamiento de registros pendientes, conservando las validaciones y el control de duplicados. | HU21 |

## 11. Configuración del entorno de pruebas

| ID | Requisito funcional | Historias relacionadas |
|---|---|---|
| RF38 | El sistema debe permitir configurar una fuente simulada que represente el intercambio de información con la empresa, manteniendo separados los datos de prueba y los datos reales. | HU22 |
| RF39 | El entorno de pruebas debe permitir utilizar escenarios de lecturas normales, consumo elevado, datos faltantes, registros duplicados y fallos de conexión para verificar el comportamiento del sistema. | HU22 |

## Reglas de negocio

### Acceso
- Cada usuario solo podrá consultar y exportar información
  de los suministros para los que tenga autorización.
- El código de suministro y el DNI ficticio se utilizarán
  en la demostración académica.
- El mecanismo para acreditar la autorización sobre suministros
  reales se definirá antes de habilitar el acceso productivo.

### Lecturas y consumo
- Una lectura acumulada indica el valor registrado por el medidor;
  no debe sumarse directamente con otras lecturas acumuladas.
- Para calcular diferencias, las lecturas deben corresponder
  al mismo medidor y a una secuencia válida.
- Un cambio o reinicio de medidor debe identificarse antes
  de continuar el cálculo; no se mostrará un consumo negativo.
- Un metro cúbico equivale a 1000 litros.
- La ausencia de lecturas no se interpretará como consumo cero.
- Si no es posible calcular un periodo completo, se indicará
  qué intervalo está cubierto y qué información falta.
- Las lecturas originales recibidas se conservarán. Una corrección
  procedente de la fuente deberá quedar vinculada al registro
  anterior y conservar su trazabilidad.

### Costos y proyecciones
- Los costos mostrados son estimaciones, no recibos oficiales
  ni pagos realizados.
- Cada cálculo debe identificar la tarifa y su vigencia.
- No se aplicará automáticamente una tarifa actual a periodos
  históricos que tenían una tarifa diferente.
- Si falta una tarifa aplicable, se informará que el costo
  no puede calcularse; no se mostrará un importe de cero.
- La proyección debe distinguir los datos observados de los valores
  estimados para el resto del periodo.
- El método de proyección y la cantidad mínima de datos necesarios
  se precisarán durante el diseño de los cálculos.

### Alertas y metas
- Una alerta de anomalía representa una posible situación
  que debe revisarse; no constituye un diagnóstico de fuga.
- Las reglas solo se evaluarán cuando la frecuencia y calidad
  de las lecturas permitan aplicarlas.
- Las metas personales no modificarán los criterios generales
  configurados por el administrador.
- Un mismo evento no generará avisos repetidos sin una regla
  de recordatorio o cambio de estado previamente definida.

## Dependencias externas por precisar

El contrato de la API se acordará con la empresa prestadora,
incluyendo:
- Identificadores de suministros y medidores.
- Tipo de medición: lectura acumulada o consumo por intervalo.
- Unidades, fechas, zona horaria y frecuencia de actualización.
- Mecanismo de autenticación y autorización.
- Disponibilidad de lecturas históricas y recuperación de pendientes.
- Identificación de correcciones, reinicios o cambios de medidor.

Estos puntos describen información necesaria para la integración;
no afirman que una API concreta ya la proporcione.