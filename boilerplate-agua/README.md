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

## Ejecución

Se requiere Node.js 22 o superior.

Desde la carpeta boilerplate-agua:

```cmd
npm install
npm run pruebas
```

Las ocho pruebas verifican conversiones y el rechazo de entradas inválidas.
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

Esta primera etapa verifica una regla del dominio. Los demás requisitos,
la persistencia, la API, las interfaces web y móvil, los trabajadores
y la integración real están pendientes de implementación.

La capacidad de 5000 usuarios deberá medirse sobre el sistema completo.

## Documentación

- [ADR-002: Clean Architecture](../arquitectura/decisiones/ADR-002-clean-architecture.md).
- [Enfoque arquitectónico](../arquitectura/enfoque/enfoque-arquitectonico.md).