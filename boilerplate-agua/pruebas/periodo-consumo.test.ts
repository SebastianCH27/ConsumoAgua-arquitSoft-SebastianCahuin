import assert from "node:assert/strict";
import { test } from "node:test";
import {
  crearPeriodo,
  evaluarCoberturaPeriodo,
} from "../src/dominio/periodo-consumo.js";
import type { PeriodoConsumo } from "../src/dominio/periodo-consumo.js";

function tramo(inicio: string, fin: string): PeriodoConsumo {
  return {
    desde: `2026-10-01T${inicio}:00.000Z`,
    hasta: `2026-10-01T${fin}:00.000Z`,
  };
}

test("RF12: conserva un periodo válido aunque se modifique la entrada", () => {
  const entrada = { ...tramo("00:00", "04:00") };
  const periodo = crearPeriodo(entrada);

  entrada.hasta = "2026-10-01T05:00:00.000Z";

  assert.deepEqual(periodo, tramo("00:00", "04:00"));
  assert.ok(Object.isFrozen(periodo));
});

test("rechaza periodos y tramos con fechas inválidas o sin duración positiva", () => {
  const valido = tramo("00:00", "04:00");

  const invalidos: unknown[] = [
    null,
    [],
    {},
    { ...valido, desde: 42 },
    { ...valido, desde: "2026-02-30T00:00:00.000Z" },
    { ...valido, desde: "2026-10-01T00:00:00Z" },
    { ...valido, hasta: "fecha inválida" },
    tramo("04:00", "04:00"),
    tramo("05:00", "04:00"),
  ];

  for (const datos of invalidos) {
    assert.throws(() => crearPeriodo(datos as PeriodoConsumo));
    assert.throws(() =>
      evaluarCoberturaPeriodo(valido, [datos as PeriodoConsumo])
    );
  }

  assert.throws(() =>
    evaluarCoberturaPeriodo(
      valido,
      null as unknown as PeriodoConsumo[],
    )
  );
});

test("RF12: reconoce cobertura completa con tramos contiguos", () => {
  const periodo = tramo("00:00", "04:00");

  assert.deepEqual(
    evaluarCoberturaPeriodo(periodo, [
      tramo("00:00", "02:00"),
      tramo("02:00", "04:00"),
    ]),
    { estado: "completo", periodo, tramosSinDatos: [] },
  );
});

test("RF13: detecta un hueco dentro del periodo solicitado", () => {
  const resultado = evaluarCoberturaPeriodo(tramo("00:00", "04:00"), [
    tramo("00:00", "01:00"),
    tramo("02:00", "04:00"),
  ]);

  assert.equal(resultado.estado, "incompleto");
  assert.deepEqual(resultado.tramosSinDatos, [
    tramo("01:00", "02:00"),
  ]);
});

test("RF13: identifica datos faltantes al inicio y al final", () => {
  const resultado = evaluarCoberturaPeriodo(tramo("00:00", "04:00"), [
    tramo("01:00", "03:00"),
  ]);

  assert.equal(resultado.estado, "incompleto");
  assert.deepEqual(resultado.tramosSinDatos, [
    tramo("00:00", "01:00"),
    tramo("03:00", "04:00"),
  ]);
});

test("RF13: sin tramos disponibles todo el periodo queda sin datos", () => {
  const periodo = tramo("00:00", "04:00");

  assert.deepEqual(evaluarCoberturaPeriodo(periodo, []), {
    estado: "incompleto",
    periodo,
    tramosSinDatos: [periodo],
  });
});

test("evalúa cobertura de tramos desordenados y superpuestos sin modificar entradas", () => {
  const entradas = Object.freeze([
    crearPeriodo(tramo("02:00", "04:00")),
    crearPeriodo(tramo("00:00", "03:00")),
    crearPeriodo(tramo("01:00", "02:00")),
  ]);

  const copia = [...entradas];
  const resultado = evaluarCoberturaPeriodo(
    tramo("00:00", "04:00"),
    entradas,
  );

  assert.equal(resultado.estado, "completo");
  assert.deepEqual(resultado.tramosSinDatos, []);
  assert.deepEqual(entradas, copia);
});

test("limita la cobertura al periodo solicitado e ignora tramos externos", () => {
  const resultado = evaluarCoberturaPeriodo(tramo("00:00", "04:00"), [
    {
      desde: "2026-09-30T22:00:00.000Z",
      hasta: "2026-09-30T23:00:00.000Z",
    },
    {
      desde: "2026-09-30T23:00:00.000Z",
      hasta: "2026-10-01T01:00:00.000Z",
    },
    tramo("03:00", "05:00"),
    tramo("05:00", "06:00"),
  ]);

  assert.equal(resultado.estado, "incompleto");
  assert.deepEqual(resultado.tramosSinDatos, [
    tramo("01:00", "03:00"),
  ]);
});