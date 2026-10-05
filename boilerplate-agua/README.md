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
La comprobación de la cobertura de periodos completos está pendiente.

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
La comprobación frente a todo el periodo seleccionado está pendiente.

## Ejecución

Se requiere Node.js 22 o superior.

Desde la carpeta boilerplate-agua:

```cmd
npm install
npm run pruebas
```

Las 33 pruebas verifican conversiones, modelos de lectura,
consumo acumulado y por intervalos, huecos, duplicados y solapamientos.
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
el consumo entre lecturas acumuladas compatibles y la suma de intervalos.

La verificación del suministro registrado, el almacenamiento,
el registro de rechazos y el control de duplicados al incorporar
lecturas a la persistencia están pendientes.

También están pendientes la comprobación de periodos completos,
los demás requisitos, la API, las interfaces web y móvil,
los trabajadores y la integración real.

La capacidad de 5000 usuarios deberá medirse sobre el sistema completo.

## Documentación

- [ADR-002: Clean Architecture](../arquitectura/decisiones/ADR-002-clean-architecture.md).
- [Enfoque arquitectónico](../arquitectura/enfoque/enfoque-arquitectonico.md).