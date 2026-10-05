import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularConsumoPeriodoIntervalos } from "../src/dominio/consumo-periodo-intervalos.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";
import type { PeriodoConsumo } from "../src/dominio/periodo-consumo.js";

function periodo(inicio: string, fin: string): PeriodoConsumo {
  return {
    desde: `2026-10-01T${inicio}:00.000Z`,
    hasta: `2026-10-01T${fin}:00.000Z`,
  };
}

function lectura(
  id: string,
  inicio: string,
  fin: string,
  valor: number,
  cambios: Partial<LecturaAgua> = {},
): LecturaAgua {
  const fechas = periodo(inicio, fin);

  return {
    id,
    suministroId: "SUM-001",
    fuente: "empresa-simulada",
    fechaInicioIntervalo: fechas.desde,
    fechaMedicion: fechas.hasta,
    fechaRecepcion: "2026-10-01T06:00:00.000Z",
    valor,
    unidad: "L",
    tipo: "intervalo",
    ...cambios,
  };
}

test("RF12: calcula el periodo completo y conserva fechas y lecturas usadas", () => {
  const solicitado = periodo("00:00", "02:00");

  const resultado = calcularConsumoPeriodoIntervalos(solicitado, [
    lectura("I1", "00:00", "01:00", 100),
    lectura("I2", "01:00", "02:00", 0.2, { unidad: "m3" }),
  ]);

  assert.deepEqual(resultado, {
    estado: "calculado",
    suministroId: "SUM-001",
    periodo: solicitado,
    desde: solicitado.desde,
    hasta: solicitado.hasta,
    consumoLitros: 300,
    consumoMetrosCubicos: 0.3,
    lecturasUsadas: ["I1", "I2"],
    tramosSinDatos: [],
  });
});

test("excluye intervalos externos y los que solo tocan los límites del periodo", () => {
  const resultado = calcularConsumoPeriodoIntervalos(
    periodo("01:00", "03:00"),
    [
      lectura("ANTES", "00:00", "01:00", 900),
      lectura("I1", "01:00", "02:00", 200),
      lectura("I2", "02:00", "03:00", 300),
      lectura("DESPUES", "03:00", "04:00", 800),
      lectura("EXTERNA", "04:00", "05:00", 700),
    ],
  );

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 500);
  assert.deepEqual(resultado.lecturasUsadas, ["I1", "I2"]);
});

test("RF13: informa consumo observado y huecos al inicio, en medio y al final", () => {
  const solicitado = periodo("00:00", "05:00");

  const resultado = calcularConsumoPeriodoIntervalos(solicitado, [
    lectura("I1", "01:00", "02:00", 100),
    lectura("I2", "03:00", "04:00", 200),
  ]);

  assert.equal(resultado.estado, "incompleto");
  assert.equal(resultado.consumoLitros, 300);
  assert.deepEqual(resultado.periodo, solicitado);
  assert.equal(resultado.desde, periodo("01:00", "04:00").desde);
  assert.equal(resultado.hasta, periodo("01:00", "04:00").hasta);

  assert.deepEqual(resultado.tramosSinDatos, [
    periodo("00:00", "01:00"),
    periodo("02:00", "03:00"),
    periodo("04:00", "05:00"),
  ]);
});

test("RF13: diferencia ausencia de datos en el periodo de un consumo conocido de cero", () => {
  const solicitado = periodo("01:00", "02:00");

  assert.equal(
    calcularConsumoPeriodoIntervalos(solicitado, []).estado,
    "no_calculable",
  );

  assert.equal(
    calcularConsumoPeriodoIntervalos(solicitado, [
      lectura("EXTERNA", "03:00", "04:00", 100),
    ]).estado,
    "no_calculable",
  );

  const resultado = calcularConsumoPeriodoIntervalos(solicitado, [
    lectura("CERO", "01:00", "02:00", 0),
  ]);

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 0);
});

test("no divide cantidades de intervalos que cruzan los límites solicitados", () => {
  const solicitado = periodo("01:00", "03:00");

  const casos = [
    ["00:00", "02:00"],
    ["02:00", "04:00"],
    ["00:00", "04:00"],
  ];

  for (const [inicio, fin] of casos) {
    const resultado = calcularConsumoPeriodoIntervalos(solicitado, [
      lectura("CRUZA", inicio, fin, 100),
    ]);

    assert.equal(resultado.estado, "no_calculable");
    assert.match(resultado.motivo, /límites del periodo/);
    assert.ok(!("consumoLitros" in resultado));
  }
});

test("conserva el rechazo de duplicados, solapamientos y lecturas incompatibles", () => {
  const primera = lectura("I1", "00:00", "01:00", 100);

  const casos: [LecturaAgua, RegExp][] = [
    [lectura("I1", "01:00", "02:00", 200), /duplicados/],
    [lectura("I2", "00:30", "02:00", 200), /superponen/],
    [
      lectura("I2", "01:00", "02:00", 200, {
        suministroId: "SUM-002",
      }),
      /suministro/,
    ],
    [
      lectura("I2", "01:00", "02:00", 200, { fuente: "otra" }),
      /fuente/,
    ],
    [
      lectura("I2", "01:00", "02:00", 200, {
        tipo: "acumulada",
        fechaInicioIntervalo: undefined,
      }),
      /intervalo/,
    ],
    [lectura("I2", "01:00", "02:00", -1), /negativo/],
  ];

  for (const [segunda, motivo] of casos) {
    const resultado = calcularConsumoPeriodoIntervalos(
      periodo("00:00", "02:00"),
      [primera, segunda],
    );

    assert.equal(resultado.estado, "no_calculable");
    assert.match(resultado.motivo, motivo);
  }
});

test("devuelve un motivo cuando el periodo o la lista de lecturas son inválidos", () => {
  const datos = [lectura("I1", "00:00", "01:00", 100)];

  const invalidos = [
    periodo("02:00", "01:00"),
    { ...periodo("00:00", "01:00"), desde: "sin fecha" },
  ];

  for (const solicitado of invalidos) {
    const resultado = calcularConsumoPeriodoIntervalos(solicitado, datos);

    assert.equal(resultado.estado, "no_calculable");
    assert.ok(resultado.motivo.length > 0);
  }

  assert.equal(
    calcularConsumoPeriodoIntervalos(
      periodo("00:00", "01:00"),
      null as unknown as LecturaAgua[],
    ).estado,
    "no_calculable",
  );
});

test("ordena las lecturas utilizadas sin modificar las entradas", () => {
  const entradas = Object.freeze([
    Object.freeze(lectura("I2", "01:00", "02:00", 200)),
    Object.freeze(lectura("I1", "00:00", "01:00", 100)),
  ]);

  const copia = [...entradas];

  const resultado = calcularConsumoPeriodoIntervalos(
    periodo("00:00", "02:00"),
    entradas,
  );

  assert.equal(resultado.estado, "calculado");
  assert.deepEqual(resultado.lecturasUsadas, ["I1", "I2"]);
  assert.deepEqual(entradas, copia);
});