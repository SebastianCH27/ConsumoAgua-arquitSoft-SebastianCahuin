# Sistema web y móvil para consultar el consumo de agua y estimar sus costos

## Estudiante
Sebastian Cahuin

## Curso
Arquitectura de Software — IS-488

## Docente
Ing. Lizbeth Jaico Quispe

## Universidad
Universidad Nacional de San Cristóbal de Huamanga

## Semestre
2026-II

## Descripción
El proyecto consiste en desarrollar una aplicación móvil y una
plataforma web para consultar el consumo de agua de cada suministro,
conocer su costo acumulado estimado y visualizar proyecciones.

La información provendrá del sistema de la empresa prestadora de agua,
que recibirá las lecturas de los medidores automáticos instalados
en las viviendas. Nuestra plataforma obtendrá esa información
mediante una integración por API.

La solución permitirá consultar el historial, comparar periodos,
recibir alertas, establecer metas de consumo y descargar reportes.

## Objetivo
Desarrollar un sistema web y móvil que permita consultar el consumo
de agua, estimar sus costos e identificar variaciones relevantes,
para facilitar el seguimiento del consumo y la planificación
del gasto del usuario.

## Análisis del caso de negocio

### Situación planteada
Los usuarios necesitan conocer cómo evoluciona su consumo de agua
durante el periodo, sin esperar a recibir el recibo para revisar
cuánto han consumido.

La propuesta considera un escenario en el que la empresa prestadora
recibe lecturas de medidores automáticos y permite consultarlas
mediante una API autorizada.

Nuestra plataforma utilizará esas lecturas para presentar información
comprensible desde celulares, tablets y computadoras.

### Problema que se busca resolver
La falta de información accesible durante el periodo dificulta
el seguimiento del consumo, la identificación de aumentos inusuales
y la planificación del gasto.

El proyecto busca transformar las lecturas disponibles en información
útil para que el usuario comprenda su consumo y pueda tomar decisiones.

### Funcionamiento propuesto
1. El medidor automático registra las lecturas de una vivienda.
2. El sistema de la empresa prestadora recibe y almacena esas lecturas,
   asociadas al suministro correspondiente.
3. Nuestra plataforma obtiene las lecturas mediante la API
   de la empresa.
4. El backend valida e incorpora los datos, calcula el consumo,
   estima los costos y evalúa las condiciones de alerta.
5. La aplicación móvil y la plataforma web muestran los resultados
   correspondientes al suministro consultado.

La actualización será automática. Su frecuencia dependerá
de la disponibilidad de lecturas y del mecanismo de integración
acordado con la empresa.

El backend será responsable de comunicarse con la API externa.
Las aplicaciones de los usuarios consultarán nuestro backend.

### Participantes principales
- Usuario del suministro: consulta su consumo, estimaciones,
  historial, alertas y demás funciones disponibles.
- Administrador de la plataforma: gestiona la configuración,
  los accesos y la operación de nuestro sistema.
- Sistema de la empresa prestadora: proporciona las lecturas
  mediante su API.

El personal de la empresa supervisará la recepción de lecturas
en su propio sistema. No se contempla que utilice nuestra plataforma
para esa tarea.

Los medidores forman parte del entorno externo. No se conectarán
directamente con nuestra aplicación.

## Alcance funcional

### Consulta y seguimiento
- Acceso a la información de los suministros autorizados.
- Consulta del consumo acumulado en litros y metros cúbicos.
- Visualización del periodo y de la última lectura disponible.
- Consulta del costo acumulado estimado.
- Proyección del consumo y del costo al finalizar el periodo.
- Consulta del historial por periodos.
- Comparación de consumos y costos estimados.
- Presentación de gráficos según la frecuencia de datos disponible.

### Alertas y apoyo al usuario
- Alertas por consumo elevado.
- Alertas por patrones de consumo que podrían indicar anomalías.
- Centro de notificaciones con fecha, motivo y estado de lectura.
- Configuración de metas de consumo o presupuesto.
- Seguimiento del avance respecto a las metas.
- Recomendaciones de ahorro relacionadas con el consumo.
- Descarga de reportes por periodo.

### Integración y administración
- Integración con la API de la empresa prestadora.
- Actualización automática de las lecturas disponibles.
- Validación de datos y control de registros duplicados.
- Gestión de suministros y permisos de acceso.
- Configuración de tarifas utilizadas en las estimaciones.
- Configuración de criterios de alerta.
- Supervisión de la actualización y de los errores de integración.
- Conservación del historial necesario para consultas y comparaciones.

## Consideraciones sobre la información
- Los costos acumulados, históricos y proyectados serán estimaciones;
  no representan pagos realizados ni reemplazan recibos oficiales.
- Las estimaciones utilizarán las tarifas configuradas y se indicará
  el periodo al que corresponden.
- Las proyecciones dependerán de las lecturas disponibles y del método
  de cálculo definido.
- Una alerta señalará una posible situación que merece revisión;
  no confirmará por sí sola la existencia de una fuga.
- Los gráficos por hora o por día solo estarán disponibles cuando
  la frecuencia de las lecturas permita calcularlos.
- Si faltan datos o se interrumpe la actualización, se informará
  al usuario sin presentar información antigua como actual.

## Límites del proyecto
- No incluye fabricar, instalar ni mantener medidores.
- No incluye desarrollar la red que comunica los medidores
  con la empresa prestadora.
- No incluye administrar ni modificar la base de datos de la empresa.
- No incluye emitir recibos oficiales, cobrar servicios
  ni controlar deudas.
- No incluye abrir o cerrar el suministro de agua.
- El servicio contemplado es agua.

## Desarrollo y pruebas
Durante el desarrollo se utilizará una fuente que simule la API
de la empresa, con suministros, lecturas e identidades ficticias
y tarifas de prueba.

La simulación permitirá probar la consulta, actualización,
validación de datos, cálculos y alertas antes de contar
con una integración real.

El diseño separará la integración externa de la lógica de negocio.
La conexión real requerirá autorización de la empresa y la definición
de las operaciones, datos y condiciones de acceso a su API.

El mecanismo de acceso a suministros reales deberá verificar
la autorización del usuario. El código de suministro y el DNI ficticio
se utilizarán para demostrar el acceso durante las pruebas.

## Arquitectura inicial
La solución se organizará en tres capas:

- Presentación: aplicación móvil, plataforma web y API REST propia.
- Lógica de negocio: acceso, suministros, lecturas, cálculos,
  historial, alertas, metas y reportes.
- Datos: almacenamiento y consulta de la información
  de nuestra plataforma.

Un componente de integración permitirá comunicarse con el sistema
de la empresa prestadora y manejar la fuente simulada durante
las pruebas.

## Organización del repositorio
- analisis-de-sistema/: actores, historias de usuario, requisitos
  funcionales, atributos de calidad, restricciones y drivers.
- arquitectura/: diagrama y explicación de la arquitectura inicial.
- README.md: presentación y análisis del caso de negocio.
- .gitignore: reglas para excluir archivos del control de versiones.