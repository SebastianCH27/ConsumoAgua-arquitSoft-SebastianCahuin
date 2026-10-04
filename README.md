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
## Capacidad y crecimiento

El sistema debe atender al menos 5000 usuarios activos simultáneamente
entre la aplicación móvil y la plataforma web, manteniendo
las condiciones de respuesta, exactitud y seguridad definidas
en los atributos de calidad.

La atención de consultas deberá continuar mientras se incorporan
nuevas lecturas y se evalúan las condiciones de alerta.

La arquitectura permitirá ampliar la capacidad cuando aumente
la demanda. La infraestructura necesaria y la capacidad superior
a 5000 usuarios se determinarán mediante pruebas.

Esta cifra representa un requisito del sistema, no una capacidad
que ya haya sido implementada o demostrada.

Los escenarios y criterios de evaluación se encuentran en
[atributos de calidad](analisis-de-sistema/04-atributos-de-calidad.md).

## Arquitectura inicial

La propuesta inicial organiza las responsabilidades en tres capas:

- Presentación: aplicación móvil, plataforma web y API REST propia.
- Lógica de negocio: acceso, suministros, lecturas, cálculos,
  historial, alertas, metas y reportes.
- Datos: almacenamiento y consulta de la información
  de nuestra plataforma.

Esta propuesta se conserva como antecedente en
[arquitectura inicial](arquitectura/arquitectura-inicial.md).

## Evolución arquitectónica en la Guía 03

La Guía 03 profundiza en la organización de los módulos,
las dependencias del código y la justificación de las decisiones.

El backend se propone como un monolito modular,
con cinco módulos funcionales:

1. Acceso y suministros.
2. Lecturas, consumo e historial.
3. Tarifas, costos y proyecciones.
4. Alertas, notificaciones y metas.
5. Reportes y recomendaciones.

La misma base de código permitirá ejecutar procesos
de API y trabajadores de actualización por separado.

Ambos reutilizarán las reglas y los casos de uso del núcleo.
Su cantidad y recursos se determinarán mediante pruebas.

Se aplicará Clean Architecture, distinguiendo:

- Dominio: conceptos y reglas fundamentales.
- Aplicación: casos de uso y contratos necesarios.
- Infraestructura: persistencia, integración, caché
  y ejecución técnica.
- Presentación: interfaces y controladores de entrada.

Los contratos de salida se definirán en Aplicación.
Infraestructura implementará esos contratos mediante adaptadores.

Las interfaces web y móvil utilizarán la API común
y consultarán información incorporada a nuestra persistencia.

La caché será selectiva y respetará autorizaciones,
versiones e invalidación.

La integración real y la simulación se separarán
mediante contratos y adaptadores, manteniendo
los datos de prueba fuera del entorno productivo.

## Registros de decisión arquitectónica

| ADR | Decisión | Drivers principales |
|---|---|---|
| [ADR-001](arquitectura/decisiones/ADR-001-monolito-modular.md) | Backend modular con procesos de actualización separados. | DA01, DA02 y DA12. |
| [ADR-002](arquitectura/decisiones/ADR-002-clean-architecture.md) | Aplicación de Clean Architecture. | DA12. |
| [ADR-003](arquitectura/decisiones/ADR-003-cache-consultas.md) | Caché selectiva para consultas de consumo. | DA01. |
| [ADR-004](arquitectura/decisiones/ADR-004-integracion-lecturas.md) | Integración de fuentes de lecturas mediante contratos y adaptadores. | DA04. |

Cada registro documenta contexto, decisión, alternativas,
justificación, consecuencias y verificación prevista.

Los drivers relacionados se detallan dentro de cada ADR.

## Índice de entregables de la Guía 03

| N.º | Entregable | Ubicación |
|---|---|---|
| 1 | Necesidad y caso de negocio | Sección «Análisis del caso de negocio» de este README. |
| 2 | Requisitos del sistema | [Requisitos funcionales](analisis-de-sistema/03-requisitos-funcionales.md) y [restricciones](analisis-de-sistema/05-restricciones.md). |
| 3 | Atributos de calidad | [Atributos y escenarios de evaluación](analisis-de-sistema/04-atributos-de-calidad.md). |
| 4 | Drivers arquitectónicos | [Drivers y evolución de la propuesta](analisis-de-sistema/06-drivers-arquitectonicos.md). |
| 5 | Decisiones arquitectónicas | [Carpeta de ADR](arquitectura/decisiones/). |
| 6 | Estilo arquitectónico | [Organización general y diagrama](arquitectura/estilo-arquitectonico.md). |

Documentación de apoyo:

- [Actores del sistema](analisis-de-sistema/01-actores.md).
- [Historias de usuario](analisis-de-sistema/02-historias-de-usuario.md).
- [Arquitectura inicial](arquitectura/arquitectura-inicial.md).
- [Enfoque arquitectónico y dependencias del código](arquitectura/enfoque/enfoque-arquitectonico.md).

El análisis identifica:

- 3 actores.
- 22 historias de usuario.
- 39 requisitos funcionales.
- 10 atributos de calidad.
- 10 restricciones.
- 12 drivers arquitectónicos.

La evolución de la Guía 03 incorpora cuatro ADR,
el estilo arquitectónico y el enfoque de dependencias.

## Diagramas de la propuesta

Los diagramas se encuentran dentro de los documentos
y utilizan Mermaid para su visualización en GitHub.

- El diagrama del estilo muestra la organización general,
  los procesos de API y actualización y los recursos utilizados.
- El diagrama del enfoque muestra las dependencias del código
  y la ubicación de los contratos y sus implementaciones.

Los módulos funcionales no representan automáticamente
servicios independientes.

La cantidad de instancias y las tecnologías concretas
permanecen pendientes de selección y validación.

## Organización del repositorio

| Ubicación | Contenido |
|---|---|
| `analisis-de-sistema/` | Actores, historias, requisitos, atributos de calidad, restricciones y drivers. |
| `arquitectura/arquitectura-inicial.md` | Propuesta inicial de tres capas. |
| `arquitectura/decisiones/` | Cuatro registros de decisión arquitectónica. |
| `arquitectura/estilo-arquitectonico.md` | Organización general y diagrama de funcionamiento. |
| `arquitectura/enfoque/` | Responsabilidades y dependencias de Clean Architecture. |
| `README.md` | Presentación, caso de negocio e índice de la documentación. |
| `.gitignore` | Reglas de exclusión del control de versiones. |

## Estado del proyecto

El repositorio contiene el análisis y la propuesta arquitectónica.

La implementación del sistema de agua y sus pruebas
están pendientes.

Antes de habilitar datos reales deberán confirmarse
la autorización y el contrato de la API externa,
incluyendo formatos, identificadores, frecuencia,
límites y recuperación de lecturas.

También deberán definirse las tecnologías, los mecanismos
de acceso para usuarios reales, las reglas pendientes
y la infraestructura de ejecución.

Las pruebas previstas comprobarán cálculos, permisos,
integración, recuperación, usabilidad, consistencia
entre interfaces y capacidad.

El requisito de 5000 usuarios simultáneos orienta el diseño.
Su cumplimiento deberá demostrarse con pruebas;
la documentación no constituye evidencia de capacidad.