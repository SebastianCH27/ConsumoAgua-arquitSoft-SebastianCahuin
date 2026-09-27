# Actores del sistema

Los actores son las personas y los sistemas externos que interactúan
directamente con nuestra plataforma de consulta del consumo de agua.

Se identifican tres actores: usuario del suministro, administrador
de la plataforma y sistema de la empresa prestadora.

## Actores humanos

| ID | Actor | ¿Qué necesita realizar? |
|---|---|---|
| ACT01 | Usuario del suministro | Acceder a sus suministros autorizados, consultar consumo y costos estimados, revisar proyecciones, historial y comparaciones, consultar alertas, configurar metas de consumo o presupuesto y descargar reportes. |
| ACT02 | Administrador de la plataforma | Gestionar accesos y suministros vinculados, configurar tarifas y criterios de alerta, supervisar la actualización de lecturas y revisar incidencias de integración. |

## Sistema externo

| ID | Actor | ¿Cómo participa? |
|---|---|---|
| ACT03 | Sistema de la empresa prestadora de agua | Proporciona mediante una API autorizada las lecturas de los suministros, con su identificación, fecha y unidad de medida, para que nuestra plataforma actualice la información y realice sus cálculos. |

## Responsabilidades y límites

### ACT01: Usuario del suministro

Representa a la persona autorizada para consultar uno o más suministros.

Sus principales acciones son:
- Acceder a la información del suministro correspondiente.
- Consultar el consumo acumulado y la última actualización.
- Revisar el costo estimado y la proyección del periodo.
- Consultar el historial y comparar periodos.
- Revisar notificaciones y marcar las que ya fueron leídas.
- Configurar metas de consumo o presupuesto.
- Consultar recomendaciones de ahorro.
- Descargar reportes de sus suministros.

El usuario no puede modificar las lecturas recibidas, las tarifas
generales ni la configuración administrativa.

### ACT02: Administrador de la plataforma

Es responsable de la operación de nuestro sistema.

Sus principales acciones son:
- Gestionar los accesos y permisos de los usuarios.
- Administrar la vinculación entre usuarios y suministros.
- Mantener las tarifas y su periodo de aplicación.
- Configurar los criterios generales de las alertas.
- Supervisar la conexión con la fuente de lecturas.
- Revisar registros rechazados, datos faltantes y errores
  de actualización.
- Gestionar la configuración del entorno de pruebas.

Sus funciones requieren autenticación y permisos administrativos.
Este rol no administra los medidores ni la base de datos
de la empresa prestadora.

Las lecturas originales recibidas se conservarán para mantener
la trazabilidad de la información.

### ACT03: Sistema de la empresa prestadora de agua

Es la fuente externa de las lecturas que utiliza nuestra plataforma.

La integración permitirá obtener las lecturas correspondientes
a los suministros autorizados. El mecanismo de intercambio
y la frecuencia de actualización dependerán de la API disponible.

La empresa seguirá gestionando la recepción de información
de los medidores dentro de su propio sistema.

## Participantes del entorno

| Participante | Relación con la solución |
|---|---|
| Medidor automático | Registra las lecturas y las transmite al sistema de la empresa. No se comunica directamente con nuestra plataforma. |
| Personal de la empresa prestadora | Supervisa la recepción de lecturas en el sistema de la empresa. No utilizará nuestra plataforma para esa función. |

Estos participantes forman parte del contexto general, pero no
se consideran actores directos de nuestra aplicación en este alcance.

## Consideraciones

- La API es la interfaz del sistema de la empresa; no constituye
  un actor adicional.
- La aplicación móvil y la plataforma web son interfaces de nuestro
  sistema; no son actores.
- La base de datos y los módulos de cálculo, alertas y reportes
  son componentes internos.
- Durante las pruebas, una fuente simulada representará al sistema
  de la empresa prestadora. No se contará como un cuarto actor.