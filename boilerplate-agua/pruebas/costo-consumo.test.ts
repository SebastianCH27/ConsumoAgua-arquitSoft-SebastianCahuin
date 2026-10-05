import assert from "node:assert/strict";
import { test } from "node:test";
import { estimarCostoConsumo } from "../src/dominio/costo-consumo.js";
import { calcularConsumoPeriodoIntervalos } from "../src/dominio/consumo-periodo-intervalos.js";
import { calcularConsumoPeriodoAcumulado } from "../src/dominio/consumo-periodo-acumulado.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";
import type { TarifaConsumo } from "../src/dominio/tarifa-consumo.js";

const fecha = (hora: string) => `2026-10-01T${hora}:00.000Z`;
const periodo = { desde: fecha("00:00"), hasta: fecha("04:00") };

function tarifa(cambios: Partial<TarifaConsumo> = {}): TarifaConsumo {
  return {
    id: "T-001", version: "v1", suministroId: "SUM-001", moneda: "PEN",
    precioPorMetroCubicoCentimos: 250,
    vigenteDesde: periodo.desde, vigenteHasta: periodo.hasta,
    ...cambios,
  };
}

function intervalo(
  id: string, inicio: string, fin: string, valor: number,
): LecturaAgua {
  return {
    id, suministroId: "SUM-001", fuente: "empresa-simulada",
    fechaInicioIntervalo: fecha(inicio), fechaMedicion: fecha(fin),
    fechaRecepcion: fecha("06:00"), valor, unidad: "m3", tipo: "intervalo",
  };
}

function consumo(valor = 3) {
  return calcularConsumoPeriodoIntervalos(periodo, [
    intervalo("I1", "00:00", "04:00", valor),
  ]);
}

test("RF15 y RF16: estima el costo y conserva consumo, tarifa y concepto incluido", () => {
  const datos = calcularConsumoPeriodoIntervalos(periodo, [
    { ...intervalo("I1", "00:00", "02:00", 1500), unidad: "L" },
    intervalo("I2", "02:00", "04:00", 1.5),
  ]);
  const resultado = estimarCostoConsumo(datos, tarifa());

  assert.equal(resultado.estado, "estimado");
  assert.equal(resultado.importeCentimos, 750);
  assert.equal(resultado.moneda, "PEN");
  assert.equal(resultado.consumo.consumoMetrosCubicos, 3);
  assert.deepEqual(resultado.consumo.lecturasUsadas, ["I1", "I2"]);
  assert.deepEqual(resultado.tarifa, tarifa());
  assert.deepEqual(resultado.conceptosIncluidos, ["Consumo de agua"]);
});

test("estima consumo acumulado y conserva todas las lecturas revisadas", () => {
  const lecturas = [100, 101, 103].map((valor, i): LecturaAgua => ({
    id: `L${i + 1}`, suministroId: "SUM-001", fuente: "empresa-simulada",
    medidorId: "MED-001", secuenciaMedidorId: "SEC-001",
    fechaMedicion: fecha(["00:00", "02:00", "04:00"][i]),
    fechaRecepcion: fecha("06:00"), valor, unidad: "m3", tipo: "acumulada",
  }));
  const resultado = estimarCostoConsumo(
    calcularConsumoPeriodoAcumulado(periodo, lecturas), tarifa(),
  );

  assert.equal(resultado.estado, "estimado");
  assert.equal(resultado.importeCentimos, 750);
  assert.ok("lecturasRevisadas" in resultado.consumo);
  assert.deepEqual(resultado.consumo.lecturasRevisadas, ["L1", "L2", "L3"]);
  assert.deepEqual(resultado.consumo.lecturasUsadas, ["L1", "L3"]);
});

test("redondea una sola vez al céntimo más cercano; medio céntimo sube", () => {
  for (const [valor, esperado] of [[1.005, 101], [1.0049, 100], [0.005, 1], [0.0049, 0]]) {
    const resultado = estimarCostoConsumo(
      consumo(valor), tarifa({ precioPorMetroCubicoCentimos: 100 }),
    );
    assert.equal(resultado.estado, "estimado");
    assert.equal(resultado.importeCentimos, esperado);
  }

  const datos = calcularConsumoPeriodoIntervalos(periodo, [
    intervalo("I1", "00:00", "02:00", 0.005),
    intervalo("I2", "02:00", "04:00", 0.005),
  ]);
  const total = estimarCostoConsumo(datos, tarifa({ precioPorMetroCubicoCentimos: 100 }));
  assert.equal(total.estado, "estimado");
  assert.equal(total.importeCentimos, 1);
});

test("RF13: estima solo el consumo conocido y conserva los huecos del periodo", () => {
  const datos = calcularConsumoPeriodoIntervalos(periodo, [
    intervalo("I1", "01:00", "01:30", 1),
    intervalo("I2", "02:30", "03:00", 1),
  ]);
  const resultado = estimarCostoConsumo(datos, tarifa({
    vigenteDesde: fecha("01:00"), vigenteHasta: fecha("03:00"),
  }));

  assert.equal(resultado.estado, "incompleto");
  assert.equal(resultado.importeCentimos, 500);
  assert.deepEqual(resultado.consumo.periodo, periodo);
  assert.deepEqual(resultado.consumo.tramosSinDatos, [
    { desde: fecha("00:00"), hasta: fecha("01:00") },
    { desde: fecha("01:30"), hasta: fecha("02:30") },
    { desde: fecha("03:00"), hasta: fecha("04:00") },
  ]);
});

test("distingue tarifa o consumo ausentes de un importe conocido de cero", () => {
  const sinTarifa = estimarCostoConsumo(consumo(), null);
  assert.equal(sinTarifa.estado, "no_estimable");
  assert.match(sinTarifa.motivo, /tarifa/);
  assert.ok(!("importeCentimos" in sinTarifa));

  const sinLecturas = calcularConsumoPeriodoIntervalos(periodo, []);
  assert.equal(sinLecturas.estado, "no_calculable");
  assert.deepEqual(estimarCostoConsumo(sinLecturas, tarifa()), {
    estado: "no_estimable", motivo: sinLecturas.motivo,
  });

  for (const [datos, precio] of [[consumo(0), 250], [consumo(), 0]] as const) {
    const resultado = estimarCostoConsumo(datos, tarifa({ precioPorMetroCubicoCentimos: precio }));
    assert.equal(resultado.estado, "estimado");
    assert.equal(resultado.importeCentimos, 0);
  }
});

test("exige una tarifa del suministro vigente durante todo el tramo conocido", () => {
  for (const cambios of [
    { suministroId: "SUM-002" },
    { vigenteDesde: fecha("01:00") },
    { vigenteHasta: fecha("03:00") },
    { vigenteDesde: fecha("04:00"), vigenteHasta: undefined },
    { precioPorMetroCubicoCentimos: -1 },
  ]) {
    assert.equal(estimarCostoConsumo(consumo(), tarifa(cambios)).estado, "no_estimable");
  }

  assert.equal(estimarCostoConsumo(consumo(), tarifa()).estado, "estimado");
  assert.equal(estimarCostoConsumo(consumo(), tarifa({ vigenteHasta: undefined })).estado, "estimado");
});

test("rechaza importes fuera de rango y admite el límite seguro", () => {
  const limite = tarifa({ precioPorMetroCubicoCentimos: Number.MAX_SAFE_INTEGER });
  const valido = estimarCostoConsumo(consumo(1), limite);
  assert.equal(valido.estado, "estimado");
  assert.equal(valido.importeCentimos, Number.MAX_SAFE_INTEGER);

  for (const valor of [2, Number.MAX_VALUE / 2000]) {
    const resultado = estimarCostoConsumo(consumo(valor), limite);
    assert.equal(resultado.estado, "no_estimable");
    assert.match(resultado.motivo, /rango/);
    assert.ok(!("importeCentimos" in resultado));
  }
});

test("la estimación conserva su información aunque cambien las entradas", () => {
  const datos = consumo();
  assert.equal(datos.estado, "calculado");
  const precio = { ...tarifa() };
  const resultado = estimarCostoConsumo(datos, precio);
  assert.equal(resultado.estado, "estimado");

  datos.consumoMetrosCubicos = 999;
  (datos.lecturasUsadas as string[])[0] = "OTRA";
  datos.periodo = { ...periodo, hasta: fecha("05:00") };
  precio.version = "v2";
  precio.precioPorMetroCubicoCentimos = 999;

  assert.equal(resultado.importeCentimos, 750);
  assert.equal(resultado.consumo.consumoMetrosCubicos, 3);
  assert.deepEqual(resultado.consumo.lecturasUsadas, ["I1"]);
  assert.deepEqual(resultado.consumo.periodo, periodo);
  assert.equal(resultado.tarifa.version, "v1");
  assert.equal(resultado.tarifa.precioPorMetroCubicoCentimos, 250);
});
