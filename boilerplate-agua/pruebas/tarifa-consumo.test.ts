import assert from "node:assert/strict";
import { test } from "node:test";
import { crearTarifa } from "../src/dominio/tarifa-consumo.js";
import type { TarifaConsumo } from "../src/dominio/tarifa-consumo.js";

function datos(cambios: Partial<TarifaConsumo> = {}): TarifaConsumo {
  return {
    id: "TAR-001",
    version: "V1",
    suministroId: "SUM-001",
    moneda: "PEN",
    precioPorMetroCubicoCentimos: 250,
    vigenteDesde: "2026-10-01T00:00:00.000Z",
    vigenteHasta: "2026-11-01T00:00:00.000Z",
    ...cambios,
  };
}

test("RF33: conserva suministro, versión, precio y vigencia de la tarifa", () => {
  const entrada = { ...datos() };
  const tarifa = crearTarifa(entrada);

  assert.deepEqual(tarifa, datos());

  entrada.version = "V2";
  entrada.precioPorMetroCubicoCentimos = 900;
  entrada.vigenteHasta = "2026-12-01T00:00:00.000Z";

  assert.equal(tarifa.version, "V1");
  assert.equal(tarifa.precioPorMetroCubicoCentimos, 250);
  assert.equal(tarifa.vigenteHasta, "2026-11-01T00:00:00.000Z");
});

test("admite precios configurados de cero y del límite entero seguro", () => {
  for (const precio of [0, Number.MAX_SAFE_INTEGER]) {
    const tarifa = crearTarifa(datos({
      precioPorMetroCubicoCentimos: precio,
    }));

    assert.equal(tarifa.precioPorMetroCubicoCentimos, precio);
  }
});

test("rechaza precios ausentes, negativos, fraccionarios o fuera del rango seguro", () => {
  const invalidos: unknown[] = [
    undefined,
    null,
    "250",
    -1,
    250.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ];

  for (const precio of invalidos) {
    assert.throws(
      () => crearTarifa(datos({
        precioPorMetroCubicoCentimos: precio as number,
      })),
      /céntimos/,
    );
  }
});

test("rechaza datos incompletos, identificadores vacíos y monedas no admitidas", () => {
  const invalidos: unknown[] = [
    null,
    [],
    {},
    { ...datos(), id: "" },
    { ...datos(), version: " " },
    { ...datos(), suministroId: "" },
    { ...datos(), moneda: "USD" },
  ];

  for (const entrada of invalidos) {
    assert.throws(() => crearTarifa(entrada as TarifaConsumo));
  }
});

test("exige fechas UTC válidas y una vigencia de duración positiva", () => {
  const casos: Partial<TarifaConsumo>[] = [
    { vigenteDesde: "2026-02-30T00:00:00.000Z" },
    { vigenteDesde: "2026-10-01T00:00:00Z" },
    { vigenteHasta: "sin fecha" },
    { vigenteHasta: datos().vigenteDesde },
    { vigenteHasta: "2026-09-01T00:00:00.000Z" },
  ];

  for (const cambios of casos) {
    assert.throws(() => crearTarifa(datos(cambios)));
  }
});

test("admite vigencia abierta cuando no se configura una fecha final", () => {
  const tarifa = crearTarifa(datos({ vigenteHasta: undefined }));

  assert.equal(tarifa.vigenteDesde, "2026-10-01T00:00:00.000Z");
  assert.equal(tarifa.vigenteHasta, undefined);
});