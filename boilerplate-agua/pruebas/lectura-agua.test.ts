import assert from "node:assert/strict";
import { test } from "node:test";
import { crearLectura } from "../src/dominio/lectura-agua.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";

function datosValidos(): LecturaAgua {
  return {
    id: "LEC-001",
    suministroId: "SUM-001",
    medidorId: "MED-001",
    fuente: "empresa-simulada",
    fechaMedicion: "2026-10-01T03:00:00.000Z",
    fechaRecepcion: "2026-10-01T03:05:00.000Z",
    valor: 123.45,
    unidad: "m3",
    tipo: "acumulada",
  };
}

test("RF06: conserva los metadatos, el valor y la unidad de una lectura", () => {
  assert.deepEqual(crearLectura(datosValidos()), datosValidos());
});

test("admite un consumo conocido de cero por intervalo sin medidor identificado", () => {
  const lectura = crearLectura({
    ...datosValidos(),
    medidorId: undefined,
    tipo: "intervalo",
    fechaInicioIntervalo: "2026-10-01T02:00:00.000Z",
    valor: 0,
    unidad: "L",
  });

  assert.equal(lectura.tipo, "intervalo");
  assert.equal(lectura.valor, 0);
});

test("una modificación de los datos de entrada no cambia la lectura creada", () => {
  const datos = { ...datosValidos() };
  const lectura = crearLectura(datos);

  datos.valor = 999;

  assert.equal(lectura.valor, 123.45);
  assert.equal(Reflect.set(lectura, "valor", 999), false);
});

test("RF07: rechaza identificadores y fuente vacíos", () => {
  for (const campo of ["id", "suministroId", "medidorId", "fuente"] as const) {
    assert.throws(
      () => crearLectura({ ...datosValidos(), [campo]: " " }),
      new RegExp(campo),
    );
  }
});

test("RF07: rechaza valores negativos, no finitos y unidades inválidas", () => {
  for (const valor of [-1, NaN, Infinity]) {
    assert.throws(() => crearLectura({ ...datosValidos(), valor }));
  }

  const datos = { ...datosValidos(), unidad: "gal" } as unknown as LecturaAgua;

  assert.throws(() => crearLectura(datos), /unidad/);
});

test("RF07: exige fechas reales con el formato interno UTC", () => {
  for (const campo of ["fechaMedicion", "fechaRecepcion"] as const) {
    for (const fecha of [
      "sin-fecha",
      "2026-02-30T03:00:00.000Z",
      "2026-10-01T03:00:00.000-05:00",
    ]) {
      assert.throws(
        () => crearLectura({ ...datosValidos(), [campo]: fecha }),
        new RegExp(campo),
      );
    }
  }
});

test("rechaza un tipo de medición no reconocido", () => {
  const datos = { ...datosValidos(), tipo: "otro" } as unknown as LecturaAgua;

  assert.throws(() => crearLectura(datos), /tipo/);
});

test("un intervalo necesita una fecha de inicio anterior al fin", () => {
  for (const inicio of [
    undefined,
    "2026-10-01T03:00:00.000Z",
    "2026-10-01T04:00:00.000Z",
  ]) {
    assert.throws(() => crearLectura({
      ...datosValidos(),
      tipo: "intervalo",
      fechaInicioIntervalo: inicio,
    }));
  }
});

test("una lectura acumulada no acepta datos de inicio de intervalo", () => {
  assert.throws(() => crearLectura({
    ...datosValidos(),
    fechaInicioIntervalo: "2026-10-01T02:00:00.000Z",
  }), /acumulada/);
});