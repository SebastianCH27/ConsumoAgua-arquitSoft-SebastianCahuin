# Drivers arquitectónicos

Los drivers arquitectónicos son los requisitos, atributos de calidad
y restricciones que influyen significativamente en la organización
del sistema de consulta del consumo de agua.

Su identificación permite justificar las decisiones de arquitectura
a partir de necesidades concretas del proyecto.

## 1. Drivers identificados

| ID | Driver arquitectónico | Origen | Influencia en el diseño |
|---|---|---|---|
| DA01 | Atender al menos 5000 usuarios activos simultáneamente mientras continúan la actualización de lecturas y la evaluación de alertas. | AC01; RF05, RF22, RF23 | Exige dimensionar la infraestructura, optimizar las consultas y separar la atención de solicitudes de los procesos de actualización y análisis para evitar que compitan sin control por los recursos. |
| DA02 | Ampliar la capacidad cuando aumenten los usuarios, suministros y lecturas. | AC02 | Orienta el diseño hacia componentes cuya capacidad pueda ampliarse. Requiere evaluar la distribución de solicitudes, el manejo de sesiones y los límites de la base de datos, verificando los resultados mediante pruebas. |
| DA03 | Incorporar lecturas sin duplicar consumos ni perder su trazabilidad. | AC03, AC05; RF06, RF07, RF08, RF10 | Requiere validación, identificación de registros, control de duplicados y conservación de lecturas originales y correcciones. Influye en el modelo de datos y en el procesamiento de actualizaciones. |
| DA04 | Integrarse con la empresa de agua y mantener las consultas durante interrupciones del proveedor. | AC04, AC07; RF05, RF09, RF13, RF14; RC04 | Requiere un componente de integración separado, almacenamiento propio de los datos recibidos y mecanismos de recuperación. Las consultas del usuario no deben depender de una llamada externa en cada operación. |
| DA05 | Proteger la información de cada suministro y diferenciar los permisos administrativos. | AC06; RF01, RF02, RF03, RF29, RF30, RF31; RC06 | Requiere verificar identidad, rol y autorización sobre el suministro en el backend, tanto en consultas como en cambios y exportaciones. Influye en el modelo de usuarios, permisos y vinculaciones. |
| DA06 | Ofrecer resultados consistentes en web y móvil. | AC09; RF10, RF11, RF15, RF17; RC01, RC03 | Requiere centralizar las reglas de cálculo en el backend y proporcionar una API común. Las interfaces deben utilizar los mismos datos, parámetros y versiones de resultados. |
| DA07 | Diferenciar información actualizada, incompleta y corregida. | AC05; RF06, RF13, RF14, RF19, RF36 | Requiere conservar fechas de medición y recepción, cobertura de periodos y estados de actualización. Esta información debe acompañar los resultados mostrados al usuario. |
| DA08 | Calcular estimaciones con tarifas vigentes y conservar su interpretación histórica. | AC03, AC05; RF15, RF16, RF17, RF18, RF33; RC08 | Requiere separar los cálculos económicos de la presentación, conservar versiones tarifarias y registrar los datos utilizados en cada resultado. Las estimaciones deben distinguirse de importes oficiales. |
| DA09 | Generar alertas y evaluar metas con datos suficientes, evitando avisos duplicados. | RF22, RF23, RF24, RF25, RF26, RF27, RF34; AC03 | Requiere organizar las reglas de evaluación, identificar los eventos detectados y almacenar su estado. El procesamiento debe considerar la calidad y frecuencia de las lecturas. |
| DA10 | Generar reportes sin comprometer la atención de las consultas principales. | RF29; AC01 | Requiere controlar el volumen de los reportes y los recursos que utilizan. Se evaluará si necesitan ejecución en segundo plano según su costo y los resultados de las pruebas. |
| DA11 | Probar la solución con una fuente simulada y sustituirla posteriormente por la integración real. | RF38, RF39; AC07, AC10; RC04, RC07 | Requiere una interfaz interna común para las fuentes de lecturas y adaptadores separados. Las reglas de consumo, costos y alertas deben funcionar independientemente del proveedor concreto. |
| DA12 | Facilitar cambios en las reglas y mantener responsabilidades claras. | AC10; RC02 | Determina la separación en presentación, lógica de negocio y datos, junto con módulos que tengan funciones delimitadas e interfaces explícitas. |

## 2. Decisiones iniciales derivadas

### Organización en capas
La solución se organizará en:
- Presentación: interfaces web y móvil y API REST propia.
- Lógica de negocio: reglas y coordinación de las operaciones.
- Datos: acceso y persistencia de la información de nuestra plataforma.

La organización lógica en tres capas no determina por sí sola
cuántos servidores o instancias se utilizarán.

### Organización por responsabilidades
Se identificarán módulos para:
- Acceso y autorización.
- Usuarios y suministros.
- Integración y recepción de lecturas.
- Gestión de lecturas y cálculo de consumo.
- Tarifas, estimaciones y proyecciones.
- Historial y comparaciones.
- Alertas y notificaciones.
- Metas y recomendaciones.
- Reportes.
- Administración y supervisión.

Estos módulos representan responsabilidades dentro de la solución.
No implican que cada uno deba desplegarse como un servicio independiente.

### Consultas e integración externa
Las consultas utilizarán la información incorporada a nuestra plataforma.

La recepción y validación de lecturas se realizará mediante
un proceso controlado, independiente de cada consulta del usuario.

La integración tendrá mecanismos para:
- Controlar tiempos de espera.
- Registrar incidencias.
- Recuperar registros pendientes cuando la fuente lo permita.
- Evitar duplicados durante los reintentos.
- Respetar las condiciones de uso de la API externa.

### Procesamiento y capacidad
El diseño deberá permitir controlar por separado los recursos
utilizados por las consultas y por los procesos de actualización,
evaluación de alertas y generación de reportes.

Se evaluarán:
- Índices y paginación de consultas.
- Ampliación de recursos de la aplicación y la base de datos.
- Varias instancias del backend y distribución de solicitudes.
- Manejo de sesiones compatible con varias instancias.
- Procesamiento en segundo plano cuando esté justificado.
- Caché de resultados cuando aporte una mejora comprobable.

Si se utiliza caché, deberá respetar los permisos por suministro
y contemplar la actualización o invalidación de resultados
cuando cambien lecturas, tarifas o parámetros.

La adopción de estos mecanismos dependerá de pruebas y mediciones;
no se consideran todos obligatorios desde la primera implementación.

### Seguridad y trazabilidad
Los controles de acceso se aplicarán en el backend y en todas
las operaciones que utilicen información protegida.

Los cálculos deberán poder relacionarse con:
- El suministro correspondiente.
- Las lecturas utilizadas y sus fechas.
- El periodo evaluado.
- La tarifa y su vigencia.
- El método y los parámetros aplicados cuando corresponda.

### Coherencia funcional
Si una decisión introduce una nueva interacción para el usuario,
se actualizarán las historias y requisitos afectados.

Por ejemplo, si un reporte se genera de forma diferida,
se deberá definir cómo consultar su estado y descargarlo
cuando esté disponible.

## 3. Aspectos pendientes de precisar

- Contrato y condiciones de acceso a la API de la empresa.
- Frecuencia, volumen y calidad de las lecturas.
- Mecanismo de autorización para suministros reales.
- Métodos de proyección y criterios de anomalías.
- Infraestructura y tecnologías de implementación.
- Volumen histórico de datos que deberá conservarse.
- Recursos necesarios para atender 5000 usuarios concurrentes.
- Condiciones de ampliación por encima de esa carga.
- Estrategia de copias de seguridad y recuperación de datos.

## 4. Validación de las decisiones

Las decisiones se revisarán mediante pruebas de:
- Carga con al menos 5000 usuarios activos simultáneamente.
- Crecimiento progresivo de la demanda.
- Exactitud de cálculos e integridad de lecturas.
- Acceso y separación de permisos.
- Fallos y recuperación de la integración.
- Consistencia entre web y móvil.
- Cambios de reglas y sustitución de la fuente de datos.

El cumplimiento de los objetivos deberá demostrarse
en una implementación y una infraestructura documentadas.
Este análisis justifica el diseño, pero no demuestra
por sí solo la capacidad del sistema.