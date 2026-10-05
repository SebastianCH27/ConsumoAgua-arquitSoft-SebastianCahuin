# Base de código del sistema de consumo de agua

Esta carpeta contiene código propio del proyecto de consumo de agua.
Desarrolla por etapas la propuesta de Clean Architecture registrada
en los documentos del repositorio.

## Primera etapa

Se implementa la conversión entre litros y metros cúbicos de RF11.
Se valida el valor numérico y la unidad antes de la conversión.

La función recibe un consumo disponible. No representa datos
faltantes como cero ni calcula consumos a partir de lecturas.
El cálculo a partir de lecturas se desarrolla en una regla separada.

## Segunda etapa: modelo de lecturas

Se incorpora el modelo relacionado con RF06 y las validaciones
estructurales de RF07. Conserva identificadores, suministro,
medidor cuando corresponda, fuente, fechas, valor, unidad y tipo.

Se distinguen lecturas acumuladas y consumos por intervalo.
Los intervalos requieren una fecha inicial anterior a la final.

Las fechas internas utilizan el formato ISO en UTC con milisegundos.
El adaptador de integración deberá normalizar las fechas del proveedor.

La lectura creada conserva sus datos aunque se modifique el objeto
utilizado para crearla.

## Tercera etapa: consumo entre lecturas acumuladas

Se incorpora el cálculo de diferencias correspondiente a una parte de RF10.
Las lecturas deben pertenecer al mismo suministro, fuente, medidor
y secuencia continua de medición confirmada.

El campo `secuenciaMedidorId` identifica esa continuidad. Su asignación
deberá basarse en información confirmada de la integración o administración,
y actualizarse después de reinicios o cambios de medidor.

Se exigen registros distintos y fechas de medición en orden creciente.
El resultado incluye consumo en litros y metros cúbicos,
fechas utilizadas e identificadores de las lecturas.

Si faltan lecturas, no se confirma la continuidad, las lecturas son
incompatibles o el contador disminuye, se devuelve `no_calculable`
con su motivo. Los datos faltantes no se convierten en consumo cero.

El cálculo cubre el intervalo entre dos lecturas compatibles.
La quinta etapa permite comparar la cobertura temporal disponible
con un periodo solicitado.

### Operaciones decimales compartidas

La representación en litros y la conversión del resultado se reúnen
en `src/dominio/calculo-decimal.ts`.
Los cálculos entre lecturas acumuladas y por intervalos
utilizan estas funciones compartidas.

## Cuarta etapa: consumo por intervalos

Se incorpora la agregación de consumos por intervalos de RF10.
Las lecturas se validan y deben pertenecer al mismo suministro y fuente.
Se ordenan por su fecha inicial sin modificar la lista recibida.

El cálculo admite intervalos contiguos y unidades compatibles.
Conserva las fechas que delimitan los datos y los identificadores utilizados.

Si existen huecos entre los intervalos, devuelve `incompleto`,
el consumo observado y los tramos sin datos. No estima el consumo faltante.

Los registros duplicados y los intervalos superpuestos se rechazan
con estado `no_calculable` y su motivo. La ausencia de lecturas
también es no calculable; un intervalo válido con consumo cero sí se admite.

La cobertura se refiere al tramo delimitado por las lecturas recibidas.
La quinta etapa añade la comprobación frente al periodo seleccionado.

## Quinta etapa: periodos y cobertura temporal

Se incorpora una parte de RF12 y RF13: la definición de un periodo
y la evaluación de los tramos disponibles frente a sus fechas.
El periodo debe tener un inicio anterior al fin y fechas internas UTC válidas.
Las lecturas y los periodos comparten el validador de `src/dominio/fecha-utc.ts`.

La evaluación detecta datos faltantes al inicio, en medio y al final.
Si no hay tramos disponibles, todo el periodo queda sin datos.
El resultado indica cobertura `completo` o `incompleto`
y conserva el periodo solicitado y los tramos faltantes.

Esta función solo evalúa fechas. Los tramos deberán provenir de datos
validados y compatibles del mismo suministro, seleccionados por el caso de uso.
La unión temporal de tramos superpuestos no suma sus cantidades
ni resuelve duplicados; el cálculo de consumos por intervalo
sigue rechazando registros duplicados y solapamientos.

Se limita la cobertura a las fechas solicitadas, sin prorratear
ni inventar cantidades. La sexta etapa utiliza esta cobertura
para calcular consumos por intervalos dentro de un periodo solicitado.
La configuración de periodos de cada suministro también está pendiente.

## Sexta etapa: consumo de un periodo mediante intervalos

Se incorpora una parte de RF10, RF12 y RF13: el cálculo del consumo
correspondiente a un periodo solicitado utilizando registros por intervalo.
La regla se encuentra en `src/dominio/consumo-periodo-intervalos.ts`.

Se validan el periodo y las lecturas recibidas. Se excluyen los intervalos
externos y los que solo tocan los límites sin entrar en el periodo.
Las lecturas seleccionadas deben pertenecer al mismo suministro y fuente.
La suma reutiliza las validaciones de duplicados y solapamientos.

El resultado conserva el periodo solicitado, las fechas que delimitan
los datos utilizados (`desde` y `hasta`) y los identificadores de las lecturas.
Si hay huecos al inicio, en medio o al final, devuelve `incompleto`,
el consumo observado y los tramos sin datos.

Si no hay datos del periodo, devuelve `no_calculable`; un consumo
conocido de cero sí es válido. Si una lectura cruza un límite del periodo,
también devuelve `no_calculable` con su motivo: no puede determinarse
qué parte de su cantidad corresponde a las fechas solicitadas.
No se distribuye el consumo suponiendo una tasa constante.

La regla trabaja con una lista proporcionada al dominio. La consulta
de repositorios y la selección del suministro autorizado desde un caso
de uso están pendientes. La séptima etapa incorpora el cálculo por periodo
mediante lecturas acumuladas.

## Séptima etapa: consumo de un periodo mediante lecturas acumuladas

Se incorpora una parte de RF10, RF12 y RF13 en
`src/dominio/consumo-periodo-acumulado.ts`.
Se seleccionan las lecturas acumuladas dentro del periodo, incluyendo
las ubicadas exactamente en sus límites, y se ordenan sin modificar la entrada.

Se requieren al menos dos lecturas. Antes de calcular la diferencia entre
la primera y la última, se revisan todos los pares consecutivos.
Deben conservar suministro, fuente, medidor y secuencia continua confirmada,
con fechas crecientes y valores de contador que no disminuyan.

`lecturasUsadas` identifica los dos extremos utilizados para la diferencia.
`lecturasRevisadas` conserva todos los registros comprobados, incluidos
los intermedios. Los duplicados y las lecturas con la misma hora de medición
se rechazan, al igual que las incompatibilidades y los resultados fuera de rango.

Dos extremos compatibles permiten conocer el consumo total entre sus fechas
aunque no haya lecturas intermedias. Esto no permite determinar
cómo se distribuyó el consumo por hora o por día.

Si los extremos no coinciden con los límites solicitados, se devuelve
`incompleto`, el consumo del tramo conocido y las fechas faltantes
al inicio o al final. Si hay menos de dos lecturas dentro del periodo,
se devuelve `no_calculable`; no se interpolan valores con lecturas externas.

Un consumo conocido de cero es válido. Las disminuciones del contador
y los cambios de medidor o secuencia producen un estado no calculable
con su motivo; esta etapa no agrega consumos de secuencias diferentes.

La consulta de suministros autorizados y la recuperación de lecturas
desde repositorios siguen pendientes.

## Octava etapa: modelo de tarifa simple de prueba

Se incorpora una parte de RF33 como base para las estimaciones de RF15.
El modelo se encuentra en `src/dominio/tarifa-consumo.ts` y conserva
identificador, versión, suministro, moneda, precio por metro cúbico
y fechas de vigencia.

En esta etapa se admite PEN y un precio expresado en céntimos enteros
no negativos dentro del rango numérico seguro. Por ejemplo,
250 céntimos equivalen a S/ 2.50 por metro cúbico.
Los precios utilizados en las pruebas son ficticios.
Un precio configurado de cero es válido; un precio ausente se rechaza.

Las fechas utilizan el formato UTC interno. La fecha final, si se configura,
debe ser posterior a la inicial; si se omite, la vigencia queda abierta.
Al aplicar la tarifa, la fecha final se considerará un límite exclusivo.
La tarifa creada conserva sus datos aunque cambie el objeto de entrada.

Esta etapa valida el modelo; la aplicación de la tarifa al consumo
y el cálculo del importe están pendientes.
Los componentes adicionales, tramos tarifarios, precios con fracciones
de céntimo y el almacenamiento histórico de versiones también están pendientes.
No se ha implementado la administración de tarifas ni la facturación oficial.


## Ejecución

Se requiere Node.js 22 o superior.

Desde la carpeta boilerplate-agua:

```cmd
npm install
npm run pruebas
```

Las 63 pruebas verifican conversiones, modelos de lectura y tarifa,
consumo acumulado y por intervalos, huecos, duplicados, solapamientos,
validación de periodos, cobertura temporal y consumo por periodo
mediante intervalos y lecturas acumuladas.
Se ejecutan con Node.js después de compilar TypeScript.

## Organización prevista

| Carpeta | Responsabilidad |
|---|---|
| `src/dominio/` | Modelos y reglas fundamentales del sistema de agua. |
| `src/aplicacion/` | Casos de uso y contratos del núcleo. |
| `src/infraestructura/` | Fuentes de datos, repositorios y otros adaptadores. |
| `src/presentacion/` | Entradas y presentación de resultados. |
| `pruebas/` | Verificaciones del dominio y los casos de uso. |

## Alcance actual

La base verifica la conversión de unidades, el modelo de lecturas,
el consumo entre lecturas acumuladas compatibles, la suma de intervalos
y la cobertura temporal frente a un periodo solicitado.
También calcula el consumo de un periodo utilizando registros por intervalo
que quedan completamente dentro de sus límites y lecturas acumuladas compatibles.
Se valida un modelo de tarifa simple de prueba con versión y vigencia.
Su aplicación al consumo y el cálculo de costos están pendientes.

La verificación del suministro registrado, el almacenamiento,
el registro de rechazos y el control de duplicados al incorporar
lecturas a la persistencia están pendientes.

También están pendientes los casos de uso para consultar suministros autorizados,
la recuperación de lecturas desde repositorios, los demás requisitos,
la API, las interfaces web y móvil,
los trabajadores y la integración real.

La capacidad de 5000 usuarios deberá medirse sobre el sistema completo.
## Documentación

- [ADR-002: Clean Architecture](../arquitectura/decisiones/ADR-002-clean-architecture.md).
- [Enfoque arquitectónico](../arquitectura/enfoque/enfoque-arquitectonico.md).