# Restricciones del sistema

Las restricciones establecen condiciones y límites para el diseño
y desarrollo del sistema de consulta del consumo de agua.

Se distinguen las decisiones adoptadas para nuestro proyecto
de las condiciones externas que todavía deben acordarse
con la empresa prestadora.

## 1. Restricciones del proyecto

| ID | Restricción | Descripción |
|---|---|---|
| RC01 | Aplicación web y móvil | La solución debe proporcionar una plataforma web y una aplicación móvil que utilicen los mismos datos y reglas de negocio del backend. |
| RC02 | Arquitectura en tres capas | El diseño inicial debe organizar las responsabilidades en presentación, lógica de negocio y datos. Esta organización no obliga a utilizar un único servidor. |
| RC03 | API REST propia | La comunicación entre nuestras aplicaciones y el backend se realizará mediante una API REST. Las interfaces de usuario no accederán directamente a las bases de datos. |
| RC04 | Fuente externa de lecturas | En el funcionamiento real, las lecturas procederán del sistema de la empresa prestadora mediante una API autorizada. La información simulada se utilizará únicamente en entornos de desarrollo y pruebas. |
| RC05 | Límite sobre infraestructura externa | El proyecto no incluye fabricar, instalar ni mantener medidores, desarrollar su red de comunicación o administrar la base de datos de la empresa prestadora. |
| RC06 | Acceso autorizado a la información | La integración solo podrá utilizar los datos y operaciones autorizados por la empresa. Los usuarios de nuestra plataforma solo podrán acceder a los suministros para los que tengan autorización. |
| RC07 | Separación de entornos | Los datos ficticios y las configuraciones de prueba deberán mantenerse separados de los datos y accesos productivos. La fuente simulada representará el contrato de integración previsto. |
| RC08 | Alcance de los resultados económicos | Los importes mostrados serán estimaciones. El sistema no emitirá recibos oficiales ni procesará pagos, cobros o deudas. |
| RC09 | Control de versiones | La documentación y el código del proyecto se gestionarán con Git y se mantendrán en GitHub, registrando los avances mediante commits. |
| RC10 | Servicio contemplado | El alcance corresponde al consumo de agua. No incluye otros servicios ni el control remoto de apertura o cierre del suministro. |

## 2. Condiciones externas pendientes de definición

La integración real depende de acuerdos con la empresa prestadora.
Las siguientes condiciones deben conocerse antes de implementarla:

| Condición | ¿Qué debe precisarse? | Efecto sobre el diseño |
|---|---|---|
| Disponibilidad y autorización de la API | Existencia de una interfaz utilizable, permisos de acceso y suministros incluidos. | Determina cuándo puede habilitarse la integración real y qué información podrá obtenerse. |
| Contrato de intercambio | Operaciones, campos, identificadores, unidades y tipo de medición proporcionados. | Determina las transformaciones y validaciones de los datos recibidos. |
| Mecanismo de actualización | Consulta periódica, envío de eventos u otro mecanismo permitido por la empresa. | Determina cómo se incorporarán automáticamente las nuevas lecturas. |
| Frecuencia de las lecturas | Intervalo de medición y tiempo de publicación de los datos. | Condiciona la actualidad de la información, los gráficos y las reglas de anomalías que pueden aplicarse. |
| Límites de uso | Cantidad de solicitudes permitidas, tamaños de respuesta y límites de consultas históricas. | Condiciona la planificación de actualizaciones y la recuperación de registros pendientes. |
| Correcciones y cambios de medidor | Forma de identificar lecturas corregidas, reinicios y sustituciones de medidores. | Condiciona la trazabilidad y la continuidad de los cálculos. |
| Recuperación de información | Disponibilidad de lecturas históricas después de una interrupción. | Determina qué datos pueden recuperarse y qué periodos deberán señalarse como incompletos. |
| Información tarifaria | Fuente de las tarifas, categorías aplicables, componentes y fechas de vigencia. | Determina la configuración necesaria para calcular estimaciones consistentes. |

Estas condiciones están pendientes de confirmación.
No se presupone que la empresa ya proporcione todas las operaciones
o los campos que necesita nuestra plataforma.

La API externa deberá respetar el contrato del proveedor.
La decisión de utilizar REST para nuestra API no obliga
a que la empresa utilice el mismo mecanismo.

## 3. Relación con la capacidad de 5000 usuarios

La atención de al menos 5000 usuarios activos simultáneamente
es un requisito de calidad, documentado en
04-atributos-de-calidad.md.

Este requisito deberá cumplirse respetando las condiciones
de la integración externa.

Las consultas de nuestros usuarios utilizarán los datos incorporados
a nuestra plataforma. La actualización desde la empresa se organizará
de acuerdo con la frecuencia y los límites permitidos por su API.

La cantidad de usuarios conectados no deberá traducirse
automáticamente en una consulta externa por cada acción.

La infraestructura necesaria para atender esa carga se definirá
y comprobará mediante pruebas.

## 4. Decisiones tecnológicas pendientes

Todavía deben seleccionarse y justificarse:
- El lenguaje y el framework del backend.
- La tecnología de la aplicación web.
- La tecnología y las plataformas admitidas por la aplicación móvil.
- El motor de base de datos.
- La infraestructura de ejecución.
- Las herramientas de pruebas y supervisión.
- Los mecanismos de autenticación y autorización para datos reales.

Estas decisiones deberán responder a los requisitos del proyecto,
la integración disponible y la capacidad de 5000 usuarios.

La arquitectura en tres capas permite distribuir la ejecución
y ampliar recursos cuando sea necesario; no establece por sí sola
una capacidad garantizada.

## 5. Criterio para actualizar las restricciones

Cuando se confirmen las condiciones de la empresa o se seleccionen
tecnologías, se actualizará este documento indicando:
- La condición o decisión adoptada.
- Su origen y justificación.
- Los requisitos y componentes afectados.

Los cambios se registrarán en Git para conservar su historial.