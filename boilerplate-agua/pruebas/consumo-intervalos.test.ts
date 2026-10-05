import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularConsumoIntervalos } from "../src/dominio/consumo-intervalos.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";

function intervalo(
  id: string, inicio: string, fin: string, valor: number,
  cambios: Partial<LecturaAgua> = {},
): LecturaAgua {
  return {
    id,
    suministroId: "SUM-001",
    fuente: "empresa-simulada",
    fechaInicioIntervalo: `2026-10-01T${inicio}:00.000Z`,
    fechaMedicion: `2026-10-01T${fin}:00.000Z`,
    fechaRecepcion: "2026-10-01T05:00:00.000Z",
    valor,
    unidad: "L",
    tipo: "intervalo",
    ...cambios,
  };
}

test("RF10 y RF11: suma intervalos contiguos con unidades diferentes", () => {
  const resultado = calcularConsumoIntervalos([
    intervalo("I1", "00:00", "01:00", 100),
    intervalo("I2", "01:00", "02:00", 0.2, { unidad: "m3" }),
  ]);

  assert.deepEqual(resultado, {
    estado: "calculado",
    suministroId: "SUM-001",
    desde: "2026-10-01T00:00:00.000Z",
    hasta: "2026-10-01T02:00:00.000Z",
    consumoLitros: 300,
    consumoMetrosCubicos: 0.3,
    lecturasUsadas: ["I1", "I2"],
    intervalosSinDatos: [],
  });
});

test("suma consumos decimales sin introducir residuos en el resultado", () => {
  const resultado = calcularConsumoIntervalos([
    intervalo("I1", "00:00", "01:00", 0.1),
    intervalo("I2", "01:00", "02:00", 0.2),
  ]);

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 0.3);
});

test("ordena lecturas recibidas fuera de orden sin modificar la lista original", () => {
  const entradas = Object.freeze([
    intervalo("I2", "01:00", "02:00", 200),
    intervalo("I1", "00:00", "01:00", 100),
  ]);

  const resultado = calcularConsumoIntervalos(entradas);

  assert.equal(resultado.estado, "calculado");
  assert.deepEqual(resultado.lecturasUsadas, ["I1", "I2"]);
  assert.deepEqual(entradas.map((lectura) => lectura.id), ["I2", "I1"]);
});

test("RF13: señala el hueco y suma únicamente el consumo observado", () => {
  const resultado = calcularConsumoIntervalos([
    intervalo("I1", "00:00", "01:00", 100),
    intervalo("I2", "02:00", "03:00", 200),
  ]);

  assert.equal(resultado.estado, "incompleto");
  assert.equal(resultado.consumoLitros, 300);
  assert.deepEqual(resultado.intervalosSinDatos, [{
    desde: "2026-10-01T01:00:00.000Z",
    hasta: "2026-10-01T02:00:00.000Z",
  }]);
});

test("RF13: distingue un consumo conocido de cero de la ausencia de lecturas", () => {
  assert.equal(calcularConsumoIntervalos([]).estado, "no_calculable");

  const resultado = calcularConsumoIntervalos([
    intervalo("I1", "00:00", "01:00", 0),
  ]);

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 0);
});

test("rechaza registros duplicados y consumos de intervalos superpuestos", () => {
  const primera = intervalo("I1", "00:00", "02:00", 100);

  assert.equal(calcularConsumoIntervalos([primera, primera]).estado, "no_calculable");

  assert.equal(calcularConsumoIntervalos([
    primera,
    intervalo("I2", "01:00", "03:00", 200),
  ]).estado, "no_calculable");
});

test("rechaza mezclas de suministros, fuentes, tipos y lecturas inválidas", () => {
  const casos: Partial<LecturaAgua>[] = [
    { suministroId: "SUM-002" },
    { fuente: "otra-fuente" },
    { tipo: "acumulada", fechaInicioIntervalo: undefined },
    { valor: -1 },
  ];

  for (const cambios of casos) {
    const resultado = calcularConsumoIntervalos([
      intervalo("I1", "00:00", "01:00", 100),
      intervalo("I2", "01:00", "02:00", 200, cambios),
    ]);

    assert.equal(resultado.estado, "no_calculable", JSON.stringify(cambios));
  }
});

test("rechaza un total que excede el rango numérico admitido", () => {
  const resultado = calcularConsumoIntervalos([
    intervalo("I1", "00:00", "01:00", Number.MAX_VALUE),
    intervalo("I2", "01:00", "02:00", Number.MAX_VALUE),
  ]);

  assert.equal(resultado.estado, "no_calculable");
});