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
ni inventar cantidades. La obtención del consumo correspondiente
a un periodo arbitrario y la selección de lecturas están pendientes.
La configuración de periodos de cada suministro también está pendiente.

## Ejecución

Se requiere Node.js 22 o superior.

Desde la carpeta boilerplate-agua:

```cmd
npm install
npm run pruebas
```

Las 41 pruebas verifican conversiones, modelos de lectura,
consumo acumulado y por intervalos, huecos, duplicados, solapamientos,
validación de periodos y cobertura temporal.
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

## Alcance actual

La base verifica la conversión de unidades, el modelo de lecturas,
el consumo entre lecturas acumuladas compatibles, la suma de intervalos
y la cobertura temporal frente a un periodo solicitado.

La verificación del suministro registrado, el almacenamiento,
el registro de rechazos y el control de duplicados al incorporar
lecturas a la persistencia están pendientes.

También están pendientes la selección de lecturas y el cálculo del consumo
para un periodo arbitrario, los demás requisitos, la API, las interfaces web y móvil,
los trabajadores y la integración real.

La capacidad de 5000 usuarios deberá medirse sobre el sistema completo.

## Documentación

- [ADR-002: Clean Architecture](../arquitectura/decisiones/ADR-002-clean-architecture.md).
- [Enfoque arquitectónico](../arquitectura/enfoque/enfoque-arquitectonico.md).