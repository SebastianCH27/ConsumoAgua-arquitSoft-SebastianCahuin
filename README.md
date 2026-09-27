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
El proyecto consiste en una aplicación móvil y una plataforma web
que permitan consultar el consumo de agua de un suministro, conocer
su costo acumulado estimado y visualizar una proyección.

Ambas aplicaciones utilizarán los mismos datos y reglas de cálculo,
de manera que las consultas presenten información consistente.

Durante el desarrollo se utilizarán datos ficticios y lecturas simuladas.
Los resultados económicos serán estimaciones y se mostrarán
diferenciados del importe de un recibo oficial.

## Objetivo
Diseñar un sistema web y móvil que permita consultar el consumo
de agua y estimar sus costos, facilitando el seguimiento del consumo
y la planificación del gasto del usuario.

## Análisis del caso de negocio

### Situación planteada
Una persona necesita conocer cuánto está consumiendo de agua
y cuánto podría representar ese consumo en dinero antes de recibir
su recibo.

Para atender esta necesidad, se propone una herramienta que permita
consultar la información de un suministro desde un celular,
una tablet o una computadora.

### Problema que se busca resolver
La falta de información accesible sobre el consumo acumulado durante
el periodo dificulta que el usuario lleve un seguimiento de su uso
del agua y anticipe el gasto que podría generar.

El proyecto aborda esta necesidad mediante un prototipo académico
que organiza lecturas, calcula el consumo y presenta estimaciones
comprensibles para el usuario.

### Solución propuesta
El usuario podrá consultar un suministro utilizando su código
y el DNI asociado, ambos ficticios en el prototipo.

A partir de las lecturas disponibles, el sistema calculará el consumo
del periodo y su costo estimado según la tarifa configurada.
También permitirá consultar el historial, comparar periodos
y visualizar una proyección del costo al finalizar el periodo.

El administrador gestionará los suministros, periodos, lecturas
simuladas y tarifas necesarios para el funcionamiento del prototipo.

### Alcance inicial
- Consulta de suministros mediante código y DNI ficticios.
- Administración de suministros y periodos de consumo.
- Registro y administración de lecturas simuladas.
- Configuración de tarifas para los cálculos del prototipo.
- Cálculo del consumo a partir de las lecturas disponibles.
- Consulta del consumo acumulado en litros.
- Cálculo del costo acumulado estimado.
- Proyección del costo al finalizar el periodo.
- Consulta del historial y comparación entre periodos.
- Presentación de información mediante tablas y gráficos.
- Acceso desde una aplicación móvil y una plataforma web.

### Límites del prototipo
- Se trabajará con datos ficticios y lecturas simuladas.
- No se requiere conexión con una empresa prestadora de agua.
- No se instalarán sensores ni se ofrecerán mediciones en tiempo real.
- La información reflejará las lecturas disponibles y su fecha.
- Los montos calculados no reemplazarán el recibo oficial.
- No se emitirán recibos oficiales ni se procesarán pagos o deudas.
- El alcance comprende únicamente el consumo de agua.

## Arquitectura inicial
La solución se organizará en tres capas:

- Presentación: aplicación móvil, plataforma web e interfaz API REST.
- Lógica de negocio: acceso, administración, gestión de lecturas,
  cálculo de consumo, estimación de costos e historial.
- Datos: almacenamiento y consulta de la información del sistema.

El diseño se detallará en el documento de arquitectura inicial.

## Organización del repositorio
- analisis-de-sistema/: actores, historias de usuario, requisitos
  funcionales, atributos de calidad, restricciones y drivers.
- arquitectura/: diagrama y explicación de la arquitectura inicial.
- README.md: presentación y análisis del caso de negocio.
- .gitignore: reglas para excluir archivos del control de versiones.