import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularConsumoAcumulado } from "../src/dominio/consumo-acumulado.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";

function lectura(cambios: Partial<LecturaAgua> = {}): LecturaAgua {
  return {
    id: "LEC-001",
    suministroId: "SUM-001",
    medidorId: "MED-001",
    secuenciaMedidorId: "SEC-001",
    fuente: "empresa-simulada",
    fechaMedicion: "2026-10-01T03:00:00.000Z",
    fechaRecepcion: "2026-10-01T04:05:00.000Z",
    valor: 100,
    unidad: "m3",
    tipo: "acumulada",
    ...cambios,
  };
}

function lecturaFinal(cambios: Partial<LecturaAgua> = {}): LecturaAgua {
  return lectura({
    id: "LEC-002",
    fechaMedicion: "2026-10-01T04:00:00.000Z",
    valor: 103,
    ...cambios,
  });
}

test("RF10 y RF12: calcula la diferencia y conserva fechas y lecturas utilizadas", () => {
  assert.deepEqual(calcularConsumoAcumulado(lectura(), lecturaFinal()), {
    estado: "calculado",
    suministroId: "SUM-001",
    medidorId: "MED-001",
    desde: "2026-10-01T03:00:00.000Z",
    hasta: "2026-10-01T04:00:00.000Z",
    consumoLitros: 3000,
    consumoMetrosCubicos: 3,
    lecturasUsadas: ["LEC-001", "LEC-002"],
  });
});

test("RF11: compara lecturas expresadas en unidades distintas", () => {
  const resultado = calcularConsumoAcumulado(
    lectura({ valor: 100000, unidad: "L" }), lecturaFinal(),
  );

  assert.equal(resultado.estado, "calculado");
  if (resultado.estado === "calculado") assert.equal(resultado.consumoLitros, 3000);
});

test("reconoce valores equivalentes y calcula diferencias decimales", () => {
  for (const [valorFinal, esperado] of [[0.00007, 0], [0.0001, 0.03]]) {
    const resultado = calcularConsumoAcumulado(
      lectura({ valor: 0.07, unidad: "L" }), lecturaFinal({ valor: valorFinal }),
    );

    assert.equal(resultado.estado, "calculado");
    if (resultado.estado === "calculado") assert.equal(resultado.consumoLitros, esperado);
  }
});

test("RF13: una lectura faltante produce un estado no calculable", () => {
  assert.equal(calcularConsumoAcumulado(null, lecturaFinal()).estado, "no_calculable");
  assert.equal(calcularConsumoAcumulado(lectura(), null).estado, "no_calculable");
});

test("RF13: rechaza parejas incompatibles o sin continuidad confirmada", () => {
  const casos: Partial<LecturaAgua>[] = [
    { suministroId: "SUM-002" },
    { fuente: "otra-fuente" },
    { medidorId: "MED-002" },
    { medidorId: undefined },
    { secuenciaMedidorId: "SEC-002", valor: 1000 },
    { secuenciaMedidorId: undefined },
    { id: "LEC-001" },
    { fechaMedicion: "2026-10-01T03:00:00.000Z" },
    { fechaMedicion: "2026-10-01T02:00:00.000Z" },
    { tipo: "intervalo", fechaInicioIntervalo: "2026-10-01T03:00:00.000Z" },
  ];

  for (const cambios of casos) {
    const resultado = calcularConsumoAcumulado(lectura(), lecturaFinal(cambios));
    assert.equal(resultado.estado, "no_calculable", JSON.stringify(cambios));
  }
});

test("una disminución del contador requiere revisión y no produce consumo negativo", () => {
  const resultado = calcularConsumoAcumulado(lectura(), lecturaFinal({ valor: 90 }));

  assert.equal(resultado.estado, "no_calculable");
  if (resultado.estado === "no_calculable") assert.match(resultado.motivo, /disminuyó/);
});

test("RF07: conserva el motivo cuando una lectura tiene datos inválidos", () => {
  const resultado = calcularConsumoAcumulado(lectura(), lecturaFinal({ valor: -1 }));

  assert.equal(resultado.estado, "no_calculable");
  if (resultado.estado === "no_calculable") assert.match(resultado.motivo, /negativo/);
});

test("rechaza resultados fuera del rango numérico en lugar de mostrar valores incorrectos", () => {
  for (const datos of [
    { valor: Number.MAX_VALUE, unidad: "m3" as const },
    { valor: Number.MIN_VALUE, unidad: "L" as const },
  ]) {
    const resultado = calcularConsumoAcumulado(
      lectura({ valor: 0, unidad: "L" }), lecturaFinal(datos),
    );

    assert.equal(resultado.estado, "no_calculable");
  }
});