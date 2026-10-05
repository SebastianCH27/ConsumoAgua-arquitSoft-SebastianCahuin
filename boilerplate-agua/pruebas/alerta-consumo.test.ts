import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluarConsumoElevado } from "../src/dominio/alerta-consumo.js";
import type { CriterioConsumoElevado } from "../src/dominio/alerta-consumo.js";
import { calcularConsumoPeriodoIntervalos } from "../src/dominio/consumo-periodo-intervalos.js";
import { calcularConsumoPeriodoAcumulado } from "../src/dominio/consumo-periodo-acumulado.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";

const fecha = (hora: string) => `2026-10-01T${hora}:00.000Z`;
const periodo = { desde: fecha("00:00"), hasta: fecha("04:00") };

function criterio(cambios: Partial<CriterioConsumoElevado> = {}): CriterioConsumoElevado {
  return {
    id: "CE-001", version: "v1", suministroId: "SUM-001",
    periodo, limite: 2000, unidad: "L", activo: true, ...cambios,
  };
}

function intervalo(valor: number, inicio = "00:00", fin = "04:00"): LecturaAgua {
  return {
    id: "I1", suministroId: "SUM-001", fuente: "empresa-simulada",
    fechaInicioIntervalo: fecha(inicio), fechaMedicion: fecha(fin),
    fechaRecepcion: fecha("06:00"), valor, unidad: "L", tipo: "intervalo",
  };
}

function consumo(valor: number) {
  return calcularConsumoPeriodoIntervalos(periodo, [intervalo(valor)]);
}

test("RF22: detecta consumo elevado y conserva criterio, periodo y lecturas", () => {
  const resultado = evaluarConsumoElevado(consumo(3000), criterio());

  assert.equal(resultado.estado, "alerta");
  assert.equal(resultado.suministroId, "SUM-001");
  assert.equal(resultado.consumoLitros, 3000);
  assert.equal(resultado.limiteLitros, 2000);
  assert.deepEqual(resultado.periodo, periodo);
  assert.deepEqual(resultado.criterio, criterio());
  assert.deepEqual(resultado.lecturasUsadas, ["I1"]);
  assert.deepEqual(resultado.lecturasRevisadas, ["I1"]);
  assert.match(resultado.motivo, /supera el límite/);
});

test("un consumo inferior, igual al límite o conocido de cero no genera alerta", () => {
  for (const valor of [0, 1000, 2000]) {
    assert.equal(evaluarConsumoElevado(consumo(valor), criterio()).estado, "sin_alerta");
  }
  assert.equal(evaluarConsumoElevado(consumo(0), criterio({ limite: 0 })).estado, "sin_alerta");
  assert.equal(evaluarConsumoElevado(consumo(1), criterio({ limite: 0 })).estado, "alerta");
});

test("límites equivalentes en litros y metros cúbicos dan el mismo resultado", () => {
  for (const valor of [9.8, 9.9, 10]) {
    const litros = evaluarConsumoElevado(consumo(valor), criterio({ limite: 9.9 }));
    const metros = evaluarConsumoElevado(consumo(valor), criterio({ limite: 0.0099, unidad: "m3" }));
    assert.deepEqual(metros.estado, litros.estado);
    assert.notEqual(metros.estado, "no_evaluable");
    if (metros.estado !== "no_evaluable") {
      assert.equal(metros.limiteLitros, 9.9);
    }
  }
});

test("evalúa lecturas acumuladas y conserva los registros intermedios revisados", () => {
  const lecturas = [100, 101, 103].map((valor, i): LecturaAgua => ({
    id: `L${i + 1}`, suministroId: "SUM-001", fuente: "empresa-simulada",
    medidorId: "MED-001", secuenciaMedidorId: "SEC-001",
    fechaMedicion: fecha(["00:00", "02:00", "04:00"][i]),
    fechaRecepcion: fecha("06:00"), valor, unidad: "m3", tipo: "acumulada",
  }));
  const resultado = evaluarConsumoElevado(
    calcularConsumoPeriodoAcumulado(periodo, lecturas), criterio(),
  );

  assert.equal(resultado.estado, "alerta");
  assert.equal(resultado.consumoLitros, 3000);
  assert.deepEqual(resultado.lecturasUsadas, ["L1", "L3"]);
  assert.deepEqual(resultado.lecturasRevisadas, ["L1", "L2", "L3"]);
});

test("RF13: datos incompletos o no calculables no se confunden con ausencia de alerta", () => {
  for (const valor of [100, 3000]) {
    const parcial = calcularConsumoPeriodoIntervalos(periodo, [intervalo(valor, "01:00", "03:00")]);
    const resultado = evaluarConsumoElevado(parcial, criterio());
    assert.equal(resultado.estado, "no_evaluable");
    assert.match(resultado.motivo, /completo/);
  }

  const sinDatos = calcularConsumoPeriodoIntervalos(periodo, []);
  assert.equal(sinDatos.estado, "no_calculable");
  assert.deepEqual(evaluarConsumoElevado(sinDatos, criterio()), {
    estado: "no_evaluable", motivo: sinDatos.motivo,
  });
});

test("exige un criterio activo del suministro y periodo consultados", () => {
  for (const cambios of [
    { activo: false },
    { suministroId: "SUM-002" },
    { periodo: { ...periodo, hasta: fecha("05:00") } },
  ]) {
    const resultado = evaluarConsumoElevado(consumo(3000), criterio(cambios));
    assert.equal(resultado.estado, "no_evaluable");
    assert.ok(resultado.motivo.length > 0);
  }
  assert.equal(evaluarConsumoElevado(consumo(3000), null).estado, "no_evaluable");
});

test("rechaza criterios inválidos y límites fuera del rango admitido", () => {
  const casos: Partial<CriterioConsumoElevado>[] = [
    { id: "" }, { version: " " }, { suministroId: "" },
    { activo: "sí" as unknown as boolean },
    { limite: -1 }, { limite: NaN }, { limite: Infinity },
    { limite: undefined as unknown as number },
    { unidad: "gal" as unknown as "L" },
    { periodo: { ...periodo, hasta: "sin fecha" } },
    { limite: Number.MAX_VALUE, unidad: "m3" },
    { limite: Number.MIN_VALUE, unidad: "L" },
  ];

  for (const cambios of casos) {
    const resultado = evaluarConsumoElevado(consumo(3000), criterio(cambios));
    assert.equal(resultado.estado, "no_evaluable");
    assert.ok(resultado.motivo.length > 0);
  }
});

test("la evaluación conserva sus datos aunque se modifiquen las entradas", () => {
  const datos = consumo(3000);
  assert.equal(datos.estado, "calculado");
  const configuracion = { ...criterio(), periodo: { ...periodo } };
  const resultado = evaluarConsumoElevado(datos, configuracion);
  assert.equal(resultado.estado, "alerta");

  datos.consumoLitros = 0;
  (datos.lecturasUsadas as string[])[0] = "OTRA";
  configuracion.version = "v2";
  configuracion.limite = 9999;
  configuracion.periodo.hasta = fecha("05:00");

  assert.equal(resultado.consumoLitros, 3000);
  assert.equal(resultado.limiteLitros, 2000);
  assert.deepEqual(resultado.lecturasUsadas, ["I1"]);
  assert.deepEqual(resultado.lecturasRevisadas, ["I1"]);
  assert.equal(resultado.criterio.version, "v1");
  assert.deepEqual(resultado.criterio.periodo, periodo);
});
