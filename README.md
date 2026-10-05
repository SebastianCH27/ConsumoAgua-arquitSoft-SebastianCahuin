# Sistema de consulta de consumo de agua

Proyecto de una plataforma web y una aplicación móvil para consultar el consumo de agua de suministros autorizados, estimar sus costos y facilitar el seguimiento del gasto.

## Datos académicos

| Dato | Información |
|---|---|
| Estudiante | Sebastian Cahuin |
| Curso | Arquitectura de Software — IS-488 |
| Docente | Ing. Lizbeth Jaico Quispe |
| Universidad | Universidad Nacional de San Cristóbal de Huamanga |
| Semestre | 2026-II |

## Caso de negocio

Los usuarios necesitan conocer cómo evoluciona su consumo durante el periodo, identificar aumentos inusuales y planificar el gasto antes de recibir el recibo del servicio.

La propuesta considera que la empresa prestadora recibe lecturas de medidores automáticos y permite consultarlas mediante una API autorizada. Nuestra plataforma utilizará esas lecturas para presentar consumos, estimaciones, historial y alertas.

### Objetivo

Desarrollar un sistema web y móvil que transforme las lecturas disponibles en información comprensible para el seguimiento del consumo y la planificación del gasto del usuario.

### Funcionamiento propuesto

1. Los medidores automáticos registran las lecturas de las viviendas.
2. La empresa prestadora recibe y almacena las lecturas por suministro.
3. Nuestro backend obtiene la información mediante la API de la empresa.
4. La plataforma valida e incorpora las lecturas a su almacenamiento propio.
5. Las reglas del sistema calculan consumos, estiman costos y evalúan alertas.
6. La web y la aplicación móvil consultan nuestro backend para mostrar los resultados autorizados.

La actualización será automática. Su frecuencia dependerá de las lecturas disponibles y del contrato acordado con la empresa.

### Participantes

- **Usuario del suministro:** consulta su consumo, estimaciones, historial y demás funciones autorizadas.
- **Administrador de la plataforma:** gestiona accesos, configuración y operación de nuestro sistema.
- **Sistema de la empresa prestadora:** proporciona las lecturas mediante su API.

El personal de la empresa supervisa las lecturas en su propio sistema. Los medidores pertenecen al entorno externo y no se conectan directamente con nuestra aplicación.

## Alcance funcional propuesto

| Módulo | Funciones principales | Requisitos |
|---|---|---|
| Acceso y suministros | Identidad, sesiones, permisos, selección de suministros y administración de accesos y periodos. | RF01–RF04 y RF30–RF32 |
| Lecturas, consumo e historial | Integración, validación, duplicados, cálculos, historial, gráficos, comparaciones, supervisión y escenarios simulados. | RF05–RF14, RF19–RF21 y RF35–RF39 |
| Tarifas, costos y proyecciones | Tarifas y vigencias, costos estimados, proyecciones y explicación de los datos y supuestos utilizados. | RF15–RF18 y RF33 |
| Alertas, notificaciones y metas | Consumo elevado, posibles anomalías, avisos, metas de consumo o presupuesto y configuración de criterios. | RF22–RF27 y RF34 |
| Reportes y recomendaciones | Reportes por suministro y periodo y recomendaciones de ahorro. | RF28 y RF29 |

Los 39 requisitos se detallan en [Requisitos funcionales](analisis-de-sistema/03-requisitos-funcionales.md). Esta tabla describe el alcance previsto; el estado implementado se indica más adelante.

### Tratamiento de la información

- Los costos son estimaciones y no reemplazan recibos oficiales ni representan pagos realizados.
- Las estimaciones deberán indicar el consumo, la tarifa, el periodo y los conceptos incluidos.
- Las proyecciones dependerán de los datos disponibles y del método definido.
- Una alerta de posible anomalía no confirma por sí sola una fuga.
- Los gráficos dependerán de la frecuencia de las lecturas disponibles.
- La ausencia de datos se distinguirá de un consumo conocido de cero.
- Se informarán la última actualización y los periodos incompletos.
- Las correcciones de lecturas deberán permitir revisar los resultados afectados y conservar su trazabilidad.

### Límites

El proyecto no incluye fabricar o mantener medidores, desarrollar su red de comunicación, modificar la base de datos de la empresa, emitir recibos oficiales, cobrar servicios, controlar deudas ni abrir o cerrar suministros.

## Propuesta arquitectónica

La [arquitectura inicial](arquitectura/arquitectura-inicial.md) organiza las responsabilidades en presentación, lógica de negocio y datos.

La evolución de la Guía 03 propone un **monolito modular** con los cinco módulos funcionales descritos. La API y los trabajadores de actualización podrán ejecutarse como procesos separados que reutilizan la misma base de código y las reglas del núcleo.

Se aplica **Clean Architecture** con las siguientes responsabilidades:

| Parte | Responsabilidad |
|---|---|
| Dominio | Modelos y reglas fundamentales del negocio. |
| Aplicación | Casos de uso y contratos necesarios para ejecutarlos. |
| Infraestructura | Adaptadores de persistencia, integración, autorización y caché. |
| Presentación | Entradas, controladores e interfaces de consulta. |

Los contratos de salida se definen en Aplicación y sus adaptadores se implementan en Infraestructura. La web y la aplicación móvil utilizarán una API común y consultarán información incorporada al almacenamiento propio.

La caché propuesta será selectiva y respetará permisos, versiones e invalidación. La fuente simulada y la integración real deberán mantenerse separadas.

### Decisiones arquitectónicas

| Registro | Decisión | Drivers principales |
|---|---|---|
| [ADR-001](arquitectura/decisiones/ADR-001-monolito-modular.md) | Monolito modular con procesos de actualización separados. | DA01, DA02 y DA12 |
| [ADR-002](arquitectura/decisiones/ADR-002-clean-architecture.md) | Clean Architecture. | DA12 |
| [ADR-003](arquitectura/decisiones/ADR-003-cache-consultas.md) | Caché selectiva para consultas. | DA01 |
| [ADR-004](arquitectura/decisiones/ADR-004-integracion-lecturas.md) | Integración de lecturas mediante contratos y adaptadores. | DA04 |

Cada ADR documenta contexto, alternativas, justificación, consecuencias y verificación prevista. Los diagramas de estilo y dependencias utilizan Mermaid para su visualización en GitHub.

### Capacidad requerida

El sistema deberá atender al menos **5000 usuarios activos simultáneamente**, considerando en conjunto la web y la aplicación móvil, mientras continúan las actualizaciones y la evaluación de alertas.

La infraestructura y la capacidad deberán validarse mediante pruebas de carga. Las 89 pruebas actuales no demuestran este requisito. Los escenarios y metas se encuentran en [Atributos de calidad](analisis-de-sistema/04-atributos-de-calidad.md).

## Documentación e índice de entregables

| Entregable | Ubicación |
|---|---|
| Necesidad y caso de negocio | Sección «Caso de negocio» de este README. |
| Requisitos y restricciones | [Requisitos funcionales](analisis-de-sistema/03-requisitos-funcionales.md) y [restricciones](analisis-de-sistema/05-restricciones.md). |
| Atributos de calidad | [Atributos y escenarios](analisis-de-sistema/04-atributos-de-calidad.md). |
| Drivers arquitectónicos | [Drivers y evolución](analisis-de-sistema/06-drivers-arquitectonicos.md). |
| Decisiones arquitectónicas | [Registros ADR](arquitectura/decisiones/). |
| Estilo arquitectónico | [Organización general y diagrama](arquitectura/estilo-arquitectonico.md). |

Documentación complementaria:

- [Actores](analisis-de-sistema/01-actores.md).
- [Historias de usuario](analisis-de-sistema/02-historias-de-usuario.md).
- [Arquitectura inicial](arquitectura/arquitectura-inicial.md).
- [Enfoque arquitectónico y dependencias](arquitectura/enfoque/enfoque-arquitectonico.md).
- [Código propio e instrucciones de ejecución](boilerplate-agua/README.md).

El análisis contiene **3 actores, 22 historias de usuario, 39 requisitos funcionales, 10 atributos de calidad, 10 restricciones y 12 drivers arquitectónicos**. La Guía 03 incorpora cuatro ADR, el estilo arquitectónico y el enfoque de dependencias.

## Organización del repositorio

| Ubicación | Contenido |
|---|---|
| `analisis-de-sistema/` | Actores, historias, requisitos, calidad, restricciones y drivers. |
| `arquitectura/` | Arquitectura inicial, ADR, estilo y enfoque arquitectónico. |
| `boilerplate-agua/` | Código propio en TypeScript y pruebas. |
| `README.md` | Presentación del proyecto e índice de documentación. |

## Estado actual de la implementación

La base de código incluye:

- Conversión entre litros y metros cúbicos.
- Modelo y validaciones estructurales de lecturas de agua.
- Consumo entre lecturas acumuladas compatibles y suma de intervalos.
- Cálculo por periodo, identificación de huecos y trazabilidad de las lecturas utilizadas y revisadas.
- Modelo de tarifa simple de prueba con versión y vigencia.
- Estimación del costo del consumo conocido, con redondeo final a céntimos.
- Evaluación de consumo elevado mediante criterios activos por suministro y periodo.
- Caso de uso `ConsultarResumenConsumo`, que comprueba permisos antes de recuperar datos y coordina consumo, costo y consumo elevado.
- Contratos de autorización y consulta definidos en Aplicación y comprobados mediante implementaciones controladas de prueba.
- Adaptadores en memoria, una fuente de datos ficticios y presentación de resultados por consola.

**Resultado actual: 97 pruebas aprobadas y 0 fallidas.** Las pruebas utilizan datos, usuarios, tarifas y criterios ficticios.

El costo implementado incluye únicamente el concepto de consumo de agua con una tarifa simple aplicable al tramo conocido. Las alertas actuales evalúan consumo elevado sobre periodos completos; los resultados incompletos se informan como no evaluables.

### Demostración ejecutable

La demostración se ejecuta con `npm run demo` desde `boilerplate-agua/`. Presenta consumo normal, elevado, incompleto y una consulta sin permiso. Sus datos se almacenan en memoria y se reinician en cada ejecución.

### Trabajo pendiente

También permanecen pendientes la acreditación de identidades reales, la API propia, la persistencia real, los trabajadores, las interfaces web y móvil, la integración externa y los demás requisitos funcionales.

La conexión a datos reales requerirá autorización de la empresa y un contrato que defina formatos, identificadores, frecuencia, límites y recuperación de lecturas. Los datos simulados deberán mantenerse fuera del entorno productivo.

Las tecnologías definitivas, la infraestructura y la capacidad del sistema se justificarán mediante la implementación y las pruebas correspondientes.