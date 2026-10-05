import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularConsumoPeriodoAcumulado } from "../src/dominio/consumo-periodo-acumulado.js";
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
  hora: string,
  valor: number,
  cambios: Partial<LecturaAgua> = {},
): LecturaAgua {
  return {
    id,
    suministroId: "SUM-001",
    medidorId: "MED-001",
    secuenciaMedidorId: "SEC-001",
    fuente: "empresa-simulada",
    fechaMedicion: `2026-10-01T${hora}:00.000Z`,
    fechaRecepcion: "2026-10-01T06:00:00.000Z",
    valor,
    unidad: "m3",
    tipo: "acumulada",
    ...cambios,
  };
}

test("RF12: calcula el periodo y conserva los extremos y todas las lecturas revisadas", () => {
  const solicitado = periodo("00:00", "04:00");

  const resultado = calcularConsumoPeriodoAcumulado(solicitado, [
    lectura("L1", "00:00", 100000, { unidad: "L" }),
    lectura("L2", "01:00", 101),
    lectura("L3", "04:00", 103),
  ]);

  assert.deepEqual(resultado, {
    estado: "calculado",
    suministroId: "SUM-001",
    medidorId: "MED-001",
    periodo: solicitado,
    desde: solicitado.desde,
    hasta: solicitado.hasta,
    consumoLitros: 3000,
    consumoMetrosCubicos: 3,
    lecturasUsadas: ["L1", "L3"],
    lecturasRevisadas: ["L1", "L2", "L3"],
    tramosSinDatos: [],
  });
});

test("dos extremos compatibles permiten calcular el total sin lecturas intermedias", () => {
  const resultado = calcularConsumoPeriodoAcumulado(
    periodo("00:00", "04:00"),
    [
      lectura("L1", "00:00", 100),
      lectura("L2", "04:00", 103),
    ],
  );

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 3000);
  assert.deepEqual(resultado.tramosSinDatos, []);
});

test("RF13: calcula solo el tramo conocido y señala cobertura incompleta", () => {
  const solicitado = periodo("00:00", "04:00");

  const resultado = calcularConsumoPeriodoAcumulado(solicitado, [
    lectura("L1", "01:00", 100),
    lectura("L2", "03:00", 102),
  ]);

  assert.equal(resultado.estado, "incompleto");
  assert.deepEqual(resultado.periodo, solicitado);
  assert.equal(resultado.desde, periodo("01:00", "03:00").desde);
  assert.equal(resultado.hasta, periodo("01:00", "03:00").hasta);
  assert.equal(resultado.consumoLitros, 2000);

  assert.deepEqual(resultado.tramosSinDatos, [
    periodo("00:00", "01:00"),
    periodo("03:00", "04:00"),
  ]);
});

test("RF13: no inventa un consumo si hay menos de dos lecturas dentro del periodo", () => {
  const solicitado = periodo("01:00", "03:00");

  const casos = [
    [],
    [lectura("L1", "01:00", 100)],
    [
      lectura("ANTES", "00:00", 99),
      lectura("DESPUES", "04:00", 103),
    ],
    [
      lectura("ANTES", "00:00", 99),
      lectura("L1", "02:00", 101),
      lectura("DESPUES", "04:00", 103),
    ],
  ];

  for (const datos of casos) {
    const resultado = calcularConsumoPeriodoAcumulado(solicitado, datos);

    assert.equal(resultado.estado, "no_calculable");
    assert.ok(!("consumoLitros" in resultado));
  }
});

test("admite consumo conocido de cero con dos contadores equivalentes", () => {
  const resultado = calcularConsumoPeriodoAcumulado(
    periodo("00:00", "04:00"),
    [
      lectura("L1", "00:00", 100),
      lectura("L2", "04:00", 100000, { unidad: "L" }),
    ],
  );

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 0);
});

test("revisa lecturas intermedias aunque los extremos parezcan compatibles", () => {
  const casos: [Partial<LecturaAgua>, RegExp][] = [
    [{ valor: 20 }, /disminuyó/],
    [{ secuenciaMedidorId: "SEC-002" }, /continuidad/],
    [{ secuenciaMedidorId: undefined }, /continuidad/],
    [{ medidorId: "MED-002" }, /medidor/],
    [{ medidorId: undefined }, /medidor/],
    [{ suministroId: "SUM-002" }, /suministro/],
    [{ fuente: "otra-fuente" }, /fuente/],
  ];

  for (const [cambios, motivo] of casos) {
    const resultado = calcularConsumoPeriodoAcumulado(
      periodo("00:00", "04:00"),
      [
        lectura("L1", "00:00", 100),
        lectura("L2", "02:00", 105, cambios),
        lectura("L3", "04:00", 110),
      ],
    );

    assert.equal(resultado.estado, "no_calculable");
    assert.match(resultado.motivo, motivo);
  }
});

test("rechaza duplicados, horas ambiguas, datos inválidos y resultados fuera de rango", () => {
  const solicitado = periodo("00:00", "04:00");
  const inicial = lectura("L1", "00:00", 100);

  const casos: [LecturaAgua[], RegExp][] = [
    [
      [
        inicial,
        lectura("L2", "02:00", 101),
        lectura("L1", "04:00", 103),
      ],
      /duplicados/,
    ],
    [
      [inicial, lectura("L2", "00:00", 101)],
      /posterior/,
    ],
    [
      [inicial, lectura("L2", "04:00", -1)],
      /negativo/,
    ],
    [
      [
        inicial,
        lectura("L2", "04:00", 103, {
          tipo: "intervalo",
          fechaInicioIntervalo: solicitado.desde,
        }),
      ],
      /acumuladas/,
    ],
    [
      [
        lectura("L1", "00:00", 0),
        lectura("L2", "04:00", Number.MAX_VALUE),
      ],
      /rango/,
    ],
  ];

  for (const [datos, motivo] of casos) {
    const resultado = calcularConsumoPeriodoAcumulado(solicitado, datos);

    assert.equal(resultado.estado, "no_calculable");
    assert.match(resultado.motivo, motivo);
  }

  assert.equal(
    calcularConsumoPeriodoAcumulado(periodo("04:00", "00:00"), []).estado,
    "no_calculable",
  );

  assert.equal(
    calcularConsumoPeriodoAcumulado(
      { ...solicitado, desde: "sin fecha" },
      [],
    ).estado,
    "no_calculable",
  );

  assert.equal(
    calcularConsumoPeriodoAcumulado(
      solicitado,
      null as unknown as LecturaAgua[],
    ).estado,
    "no_calculable",
  );
});

test("excluye lecturas externas y ordena las utilizadas sin modificar las entradas", () => {
  const entradas = Object.freeze([
    Object.freeze(
      lectura("EXTERNA", "05:00", 1, {
        secuenciaMedidorId: "SEC-002",
      }),
    ),
    Object.freeze(lectura("L2", "04:00", 103)),
    Object.freeze(lectura("L1", "00:00", 100)),
  ]);

  const copia = [...entradas];

  const resultado = calcularConsumoPeriodoAcumulado(
    periodo("00:00", "04:00"),
    entradas,
  );

  assert.equal(resultado.estado, "calculado");
  assert.equal(resultado.consumoLitros, 3000);
  assert.deepEqual(resultado.lecturasUsadas, ["L1", "L2"]);
  assert.deepEqual(resultado.lecturasRevisadas, ["L1", "L2"]);
  assert.deepEqual(entradas, copia);
});