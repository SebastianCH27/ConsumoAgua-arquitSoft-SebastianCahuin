# Base de código del sistema de consumo de agua

Código propio en TypeScript para desarrollar y comprobar las reglas del proyecto de consumo de agua. Su organización sigue la propuesta de Clean Architecture documentada en el repositorio.

## Requisitos y ejecución

Se requiere **Node.js 22 o superior** y npm.

En Windows CMD, entra en esta carpeta:

```cmd
cd /d C:\Users\HP\Desktop\ConsumoAgua-arquitSoft-SebastianCahuin\boilerplate-agua
```

Instala las dependencias:

```cmd
npm install
```

Ejecuta las pruebas:

```cmd
npm run pruebas
```

El comando compila TypeScript y ejecuta las pruebas con Node.js. Para compilar sin ejecutar pruebas:

```cmd
npm run compilar
```

**Resultado actual: 97 pruebas aprobadas y 0 fallidas.**

## Funciones implementadas

| Función | Comportamiento | Requisitos relacionados |
|---|---|---|
| Conversión de unidades | Conversión entre litros y metros cúbicos; validación de valores y unidades. | RF11 |
| Modelo de lecturas | Identificadores, suministro, fuente, fechas, tipo de medición, valor y unidad; validaciones estructurales. | Parte de RF06 y RF07 |
| Consumo acumulado | Diferencia entre lecturas compatibles del mismo suministro, fuente, medidor y secuencia confirmada. | Parte de RF10 |
| Consumo por intervalos | Suma de intervalos compatibles; rechazo de duplicados y solapamientos. | Parte de RF10 |
| Periodos y cobertura | Validación de fechas y detección de tramos sin información. | Parte de RF12 y RF13 |
| Consumo por periodo | Selección de lecturas y cálculo mediante intervalos o lecturas acumuladas. | Parte de RF10, RF12 y RF13 |
| Tarifa simple | Precio en céntimos por metro cúbico, moneda PEN, versión y vigencia. | Parte de RF33 |
| Costo estimado | Aplicación de una tarifa vigente al consumo conocido y redondeo final a céntimos. | Parte de RF15 y RF16 |
| Consumo elevado | Comparación con un límite activo del suministro y periodo; conservación del criterio utilizado. | Parte de RF22 y RF34 |
| Consulta del resumen | Autorización previa y coordinación del consumo, costo y evaluación de consumo elevado. | Apoya RF03 y las consultas implementadas |

Estas funciones constituyen una implementación parcial del alcance del proyecto.

## Reglas de cálculo y trazabilidad

### Lecturas y fechas

Se distinguen lecturas acumuladas y consumos medidos por intervalo. Las fechas internas utilizan ISO en UTC con milisegundos, por ejemplo `2026-10-01T00:00:00.000Z`.

Una lectura por intervalo necesita un inicio anterior a su fin. Una lectura acumulada no incluye inicio de intervalo.

Para calcular diferencias acumuladas se exige una continuidad confirmada mediante `secuenciaMedidorId`. Su asignación deberá basarse en información del proveedor o de la administración.

### Consumo y cobertura

- Los datos ausentes no se convierten en consumo cero.
- Los intervalos duplicados o superpuestos se rechazan.
- Los huecos producen un resultado incompleto con el consumo observado y los tramos sin datos.
- Una lectura por intervalo que cruza un límite del periodo no se prorratea: el resultado es no calculable.
- En lecturas acumuladas se revisan todos los pares consecutivos antes de restar los extremos.
- Dos extremos compatibles permiten conocer el total entre sus fechas, aunque no haya registros intermedios; no permiten conocer su distribución por hora.
- Las disminuciones del contador o las secuencias incompatibles requieren revisión y no producen consumos negativos.
- Los resultados conservan fechas y referencias a las lecturas utilizadas; los acumulados por periodo también conservan las lecturas revisadas.

Las operaciones decimales compartidas utilizan la representación decimal de los valores numéricos recibidos y rechazan resultados fuera del rango admitido.

### Tarifas y costos

Las tarifas de prueba utilizan PEN y precios en céntimos enteros por metro cúbico. Por ejemplo, 250 céntimos equivalen a S/ 2.50 por metro cúbico. Los precios son ficticios.

La tarifa debe pertenecer al suministro y cubrir todo el tramo conocido. Su fecha final es exclusiva; un tramo puede terminar exactamente en esa fecha. El cálculo con varias versiones dentro del tramo está pendiente.

El importe se redondea una sola vez al céntimo más cercano; medio céntimo se redondea hacia arriba. Un consumo conocido de cero o un precio configurado de cero permiten un importe de cero.

La estimación conserva consumo, lecturas, tarifa y concepto incluido. Si hay huecos, estima solamente el consumo conocido y mantiene el estado incompleto. El concepto implementado es **consumo de agua**.

### Consumo elevado

La evaluación requiere un periodo completo y un criterio activo del mismo suministro y periodo. Los límites pueden expresarse en litros o metros cúbicos.

- `alerta`: el consumo supera estrictamente el límite.
- `sin_alerta`: el consumo es igual o inferior al límite.
- `no_evaluable`: faltan datos completos o un criterio aplicable.

La evaluación conserva la versión del criterio y las lecturas utilizadas y revisadas. El registro de notificaciones y la detección de posibles anomalías están pendientes.

## Caso de uso de consulta del resumen

`ConsultarResumenConsumo` se encuentra en `src/aplicacion/consultar-resumen-consumo.ts`.

1. Valida y conserva los parámetros de la solicitud.
2. Comprueba el permiso del usuario sobre el suministro.
3. Recupera datos mediante el contrato de repositorio únicamente si existe permiso.
4. Verifica el suministro, las lecturas y la identificación de la versión de datos.
5. Coordina consumo por periodo, costo estimado y evaluación de consumo elevado.
6. Devuelve los resultados con el suministro, periodo y versión consultados.

Los contratos `AutorizacionConsulta` y `RepositorioConsultaAgua` se definen en `src/aplicacion/contratos-consulta.ts`. El contrato del repositorio exige lecturas y configuraciones de una misma versión consistente.

La respuesta puede ser `consultado`, `solicitud_invalida`, `no_autorizado`, `no_disponible` o `error`. Una respuesta `consultado` puede contener resultados incompletos, no calculables, no estimables o no evaluables.

Las pruebas utilizan usuarios ficticios, implementaciones controladas y adaptadores en memoria. La acreditación de identidades reales y los adaptadores de persistencia real están pendientes.

## Organización del código

| Carpeta | Responsabilidad | Estado |
|---|---|---|
| `src/dominio/` | Modelos, validaciones y reglas de cálculo. | Implementación parcial. |
| `src/aplicacion/` | Caso de uso de consulta y contratos. | Implementación parcial. |
| `pruebas/` | Pruebas del dominio, caso de uso, adaptadores y presentación. | 97 pruebas aprobadas. |
| `src/infraestructura/` | Repositorio y permisos en memoria y fuente de datos ficticios. | Demostración implementada. |
| `src/presentacion/` | Presentación del resumen por consola. | Demostración implementada. |
| `src/demo.ts` | Composición y ejecución de los escenarios ficticios. | Implementado. |

Aplicación depende del dominio y de sus propios contratos. Los adaptadores de Infraestructura implementan esos contratos. `src/demo.ts` conecta sus dependencias; la presentación recibe los resultados del caso de uso.

## Alcance de las pruebas

Las pruebas verifican cálculos, validaciones, unidades equivalentes, cobertura, vigencia de tarifas, redondeo, trazabilidad y estados de información ausente o incompleta.

También comprueban autorización antes de leer datos, ambas modalidades de consumo, fallos de los contratos y conservación de los parámetros durante operaciones asíncronas.

Las ocho pruebas nuevas verifican los adaptadores en memoria, la conservación de las instantáneas, la selección por periodo y los cuatro escenarios de la demostración.

Estas pruebas no demuestran integración con una API real, persistencia real ni capacidad para 5000 usuarios simultáneos.

## Demostración ejecutable

Desde `boilerplate-agua/`, ejecuta:

```cmd
npm run demo
```

`src/demo.ts` conecta el caso de uso con los permisos y el repositorio en memoria. La fuente `src/infraestructura/fuente-agua-simulada.ts` proporciona las lecturas y configuraciones ficticias iniciales. No realiza peticiones HTTP.

| Escenario | Consumo observado | Costo estimado | Consumo elevado |
|---|---|---|---|
| Normal | 2000 L | S/ 5.00 | `sin_alerta` |
| Elevado, con lecturas acumuladas | 3000 L | S/ 7.50 | `alerta` |
| Incompleto | 1000 L | S/ 2.50, incompleto | `no_evaluable` |
| Usuario sin permiso | Información no recuperada | Información no recuperada | `no_autorizado` en la consulta |

El precio ficticio es S/ 2.50 por metro cúbico y el límite de prueba es 2500 litros para el periodo indicado. La presentación incluye la versión, las lecturas utilizadas y los tramos sin datos.

Los datos se copian y conservan como instantáneas en memoria. El repositorio tiene una versión y una tarifa simple por suministro; no implementa la incorporación de actualizaciones ni un historial de revisiones. Los datos se reinician en cada ejecución y las fechas se muestran en UTC.

## Trabajo pendiente

Permanecen pendientes los demás requisitos funcionales, la API propia, las interfaces web y móvil, los trabajadores, la persistencia real, la integración externa y la acreditación de identidades reales.

También quedan pendientes tarifas con componentes adicionales o varias versiones, proyecciones, posibles anomalías, gestión de notificaciones y pruebas de capacidad del sistema completo.

## Documentación relacionada

- [Presentación general del proyecto](../README.md).
- [Requisitos funcionales](../analisis-de-sistema/03-requisitos-funcionales.md).
- [ADR-002: Clean Architecture](../arquitectura/decisiones/ADR-002-clean-architecture.md).
- [Enfoque arquitectónico](../arquitectura/enfoque/enfoque-arquitectonico.md).