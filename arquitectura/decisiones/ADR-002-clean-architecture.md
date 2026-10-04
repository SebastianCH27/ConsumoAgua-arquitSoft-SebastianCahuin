# ADR-002: Aplicar Clean Architecture al sistema de consumo de agua

- Fecha: 2026-10-04
- Estado: Aceptada para la propuesta arquitectónica.
- Driver principal: DA12 — Mantenibilidad y evolución modular.
- Drivers relacionados: DA03 — Integridad de lecturas,
  DA06 — Consistencia entre web y móvil,
  DA08 — Estimaciones e interpretación histórica
  y DA11 — Sustitución de la fuente simulada.
- Atributos relacionados: AC03, AC05, AC07, AC09 y AC10.
- Decisión relacionada: ADR-001 — Backend modular con procesos
  de actualización separados.

## Contexto

El sistema deberá calcular consumos, estimar costos, generar
proyecciones, evaluar alertas y presentar información histórica.

Estas operaciones dependerán de lecturas cuya calidad, frecuencia
y formato estarán condicionados por la empresa prestadora.

Durante el desarrollo se utilizará una fuente simulada.
Posteriormente, la integración real deberá respetar el contrato
autorizado del proveedor.

Las reglas deberán conservar un comportamiento consistente
cuando se ejecuten desde la API, los trabajadores de actualización
o las pruebas. También deberán producir resultados equivalentes
para web y móvil cuando se utilicen los mismos datos y parámetros.

## Decisión

Se aplicará Clean Architecture, distinguiendo Dominio,
Aplicación, Infraestructura y Presentación.

Dominio y Aplicación formarán el núcleo de la solución.
Las dependencias del código se dirigirán hacia ese núcleo.

Los contratos de salida requeridos por los casos de uso
se definirán en Aplicación y utilizarán los tipos del dominio.

Infraestructura implementará esos contratos mediante repositorios
y adaptadores concretos.

Los cinco módulos establecidos en ADR-001 conservarán
sus responsabilidades e interfaces de colaboración.

## Distribución de responsabilidades

| Parte | Responsabilidades | Ejemplos propuestos |
|---|---|---|
| Dominio | Representar los conceptos y reglas fundamentales del sistema. | Suministro, Lectura, Periodo, Tarifa, Meta y Alerta; reglas de unidades, compatibilidad de lecturas y vigencia tarifaria. |
| Aplicación | Coordinar los casos de uso, comprobar autorizaciones y utilizar los contratos necesarios. | Incorporar lecturas, consultar el resumen, calcular estimaciones, evaluar alertas y generar reportes. |
| Infraestructura | Resolver persistencia, comunicación externa y ejecución técnica de trabajos. | Repositorios, adaptador de la empresa, fuente simulada, caché y mecanismos de coordinación de tareas. |
| Presentación | Recibir solicitudes y acciones, transformar sus datos y presentar resultados. | Interfaces web y móvil y controladores de la API REST propia. |

Los nombres anteriores describen elementos del diseño.
Su implementación concreta se definirá durante el desarrollo.

## Reglas de dependencia

1. Dominio mantendrá sus reglas sin importar componentes de interfaz,
   clientes HTTP, herramientas de tareas o implementaciones de datos.

2. Aplicación dependerá del dominio y de sus propios contratos.
   Los casos de uso recibirán las implementaciones necesarias
   mediante esos contratos.

3. Infraestructura implementará los contratos del núcleo
   y transformará los formatos externos al modelo interno.

4. Presentación delegará las operaciones a los casos de uso.
   Las reglas de consumo, tarifas y alertas se mantendrán
   en los componentes responsables del núcleo.

5. La configuración conectará los casos de uso con los repositorios,
   fuentes de lecturas y demás adaptadores seleccionados.

6. Los procesos de la API y los trabajadores reutilizarán
   las mismas reglas y casos de uso, respetando las autorizaciones
   correspondientes a cada operación.

## Reglas relevantes del dominio

### Lecturas y consumo

- Las lecturas acumuladas compatibles permitirán calcular diferencias.
- Los consumos por intervalo se agregarán evitando superposiciones.
- Un metro cúbico equivale a 1000 litros.
- Los cambios o reinicios de medidor deberán identificarse.
- La ausencia de lecturas no se interpretará como consumo cero.
- Los resultados identificarán el intervalo cubierto y sus limitaciones.

### Tarifas y estimaciones

- Los cálculos utilizarán tarifas aplicables al suministro y periodo.
- Se conservarán las versiones necesarias para interpretar
  estimaciones históricas.
- La ausencia de una tarifa aplicable impedirá calcular el importe;
  se informará esa condición.
- Los costos y proyecciones se presentarán como estimaciones.
- El método de proyección y sus datos mínimos deberán definirse.

### Alertas y metas

- Las reglas se evaluarán cuando existan datos suficientes.
- Una alerta de anomalía indicará una posible situación para revisar.
- Las metas personales conservarán su relación con un suministro
  y periodo.
- Los avisos se identificarán para controlar su repetición.

## Coordinación de los casos de uso

Aplicación coordinará las reglas con las operaciones de persistencia
y los demás módulos.

Por ejemplo, incorporar lecturas requerirá:

1. Obtener los registros mediante el contrato de la fuente.
2. Transformar y validar la información recibida.
3. Comprobar registros existentes y evitar duplicados.
4. Conservar originales, incidencias y correcciones.
5. Actualizar los resultados afectados.
6. Evaluar las alertas aplicables.
7. Registrar el estado del trabajo.

Los contratos de persistencia y sus implementaciones deberán
permitir coordinar estas operaciones y controlar la concurrencia.
Las reglas aisladas del dominio no resolverán por sí solas
las escrituras simultáneas o la recuperación de tareas.

## Sustitución de la fuente de lecturas

La aplicación utilizará un contrato interno para obtener lecturas
y conocer los resultados de la integración.

La fuente simulada y el adaptador real implementarán ese contrato
según las capacidades previstas y confirmadas.

El adaptador real concentrará la autenticación técnica,
las solicitudes, los formatos y los errores del proveedor.

La simulación utilizará identidades y datos ficticios separados
del entorno productivo.

El cambio de fuente requerirá configurar el adaptador correspondiente
y verificar que los datos equivalentes produzcan resultados
equivalentes en el núcleo.

## Coherencia entre consultas y actualizaciones

Los trabajadores y la API utilizarán las mismas reglas,
conforme a ADR-001.

Los resultados almacenados identificarán las lecturas,
tarifas y parámetros utilizados.

Una corrección deberá provocar la revisión de los cálculos
afectados. La publicación de nuevos resultados deberá evitar
combinaciones inconsistentes de consumo, costo y proyección.

Las aplicaciones web y móvil utilizarán los resultados
proporcionados por la API común.

## Alternativas consideradas

| Alternativa | Evaluación |
|---|---|
| Mantener capas con dependencias directas del negocio hacia implementaciones de datos y proveedores | Separa responsabilidades generales, pero vincula los casos de uso con detalles técnicos que pueden cambiar. |
| Aplicar Clean Architecture con contratos en el núcleo | Permite definir las necesidades de la aplicación y resolver sus implementaciones mediante adaptadores. Es la alternativa seleccionada. |

## Justificación

La decisión responde a DA12 porque permite localizar los cambios
en los componentes responsables y controlar su alcance.

Contribuye a DA06 al mantener reglas comunes para web y móvil,
y a DA11 al separar los cálculos de la fuente concreta de lecturas.

También facilita verificar las reglas de integridad y las
estimaciones históricas relacionadas con DA03 y DA08.

## Consecuencias favorables

- Reglas y casos de uso comprobables por separado.
- Reutilización del núcleo entre API y trabajadores.
- Integraciones externas concentradas en adaptadores.
- Posibilidad de utilizar fuentes y repositorios de prueba.
- Cambios técnicos localizados cuando los contratos se mantienen.

## Compromisos y condiciones

- Será necesario definir y mantener contratos y adaptadores.
- Los formatos externos deberán transformarse al modelo interno.
- Los cambios en los contratos pueden afectar a varias implementaciones.
- La separación de carpetas deberá reflejar dependencias reales.
- Los módulos deberán respetar sus responsabilidades sobre los datos.
- La coordinación de tareas y la consistencia requerirán
  mecanismos adicionales de persistencia y concurrencia.

## Verificación prevista

Se revisarán las importaciones y dependencias para comprobar
que Dominio y Aplicación mantienen su independencia
de las implementaciones técnicas.

Se probarán reglas y casos de uso con escenarios de:

- Lecturas normales, duplicadas, corregidas y fuera de orden.
- Datos faltantes, unidades diferentes y cambios de medidor.
- Tarifas con distintas vigencias y periodos históricos.
- Proyecciones sin datos suficientes.
- Alertas y control de avisos repetidos.
- Consultas y exportaciones de suministros no autorizados.
- Sustitución de la fuente simulada por un adaptador equivalente.
- Ejecución de operaciones desde la API y los trabajadores.

Las pruebas de integración comprobarán que los adaptadores
cumplen sus contratos.

La capacidad de 5000 usuarios se evaluará conforme a AC01
sobre la implementación completa y su infraestructura.

En esta etapa se documenta la decisión. Las verificaciones
del sistema de agua están pendientes de implementación.