# Base de código del sistema de consumo de agua

Esta carpeta contiene código propio del proyecto de consumo de agua.
Desarrolla por etapas la propuesta de Clean Architecture registrada
en los documentos del repositorio.

## Primera etapa

Se implementa la conversión entre litros y metros cúbicos de RF11.
Se valida el valor numérico y la unidad antes de la conversión.

La función recibe un consumo disponible. No representa datos
faltantes como cero ni calcula consumos a partir de lecturas.
Esas responsabilidades se incorporarán en las siguientes etapas.

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

## Ejecución

Se requiere Node.js 22 o superior.

Desde la carpeta boilerplate-agua:

```cmd
npm install
npm run pruebas
```

Las 17 pruebas verifican conversiones, metadatos, validaciones de lecturas
y restricciones de los intervalos.
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

La base verifica la conversión de unidades y el modelo de lecturas.
La verificación del suministro registrado, el almacenamiento,
el registro de rechazos y el control de duplicados están pendientes.

También están pendientes los cálculos a partir de lecturas,
los demás requisitos, la API, las interfaces web y móvil,
los trabajadores y la integración real.

La capacidad de 5000 usuarios deberá medirse sobre el sistema completo.

## Documentación

- [ADR-002: Clean Architecture](../arquitectura/decisiones/ADR-002-clean-architecture.md).
- [Enfoque arquitectónico](../arquitectura/enfoque/enfoque-arquitectonico.md).