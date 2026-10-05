import assert from "node:assert/strict";
import { test } from "node:test";
import { ConsultarResumenConsumo } from "../src/aplicacion/consultar-resumen-consumo.js";
import type { DatosConsultaAgua } from "../src/aplicacion/contratos-consulta.js";
import { AutorizacionEnMemoria } from "../src/infraestructura/autorizacion-en-memoria.js";
import { RepositorioAguaEnMemoria } from "../src/infraestructura/repositorio-agua-en-memoria.js";
import { crearDatosSimulados, PERIODO_DEMO } from "../src/infraestructura/fuente-agua-simulada.js";
import { formatearResumen } from "../src/presentacion/formatear-resumen.js";

function preparar() {
  const datos = crearDatosSimulados();
  return new ConsultarResumenConsumo(
    new AutorizacionEnMemoria(datos.map(({ suministroId }) => ({
      usuarioId: "USU-DEMO", suministroId,
    }))),
    new RepositorioAguaEnMemoria(datos),
  );
}

function consultar(suministroId: string) {
  return preparar().ejecutar({ usuarioId: "USU-DEMO" }, {
    suministroId, periodo: PERIODO_DEMO,
  });
}

test("el adaptador de permisos conserva sus accesos y separa usuarios y suministros", async () => {
  const acceso = { usuarioId: "A:B", suministroId: "C" };
  const permisos = new AutorizacionEnMemoria([acceso]);
  acceso.usuarioId = "A";
  acceso.suministroId = "B:C";
  assert.equal(await permisos.puedeConsultar("A:B", "C"), true);
  assert.equal(await permisos.puedeConsultar("A", "B:C"), false);
  assert.equal(await permisos.puedeConsultar("desconocido", "C"), false);
  assert.equal(await permisos.puedeConsultar("A:B", "otro"), false);
});

test("el repositorio conserva la instantánea aunque cambien las entradas o se intenten modificar las salidas", async () => {
  const base = crearDatosSimulados()[0];
  const entrada = {
    ...base, lecturas: base.lecturas.map((lectura) => ({ ...lectura })),
    tarifa: { ...base.tarifa! },
    criterioConsumoElevado: {
      ...base.criterioConsumoElevado!, periodo: { ...PERIODO_DEMO },
    },
  };
  const repositorio = new RepositorioAguaEnMemoria([entrada]);
  entrada.versionDatos = "cambiada";
  entrada.lecturas[0].valor = 99;
  entrada.tarifa.precioPorMetroCubicoCentimos = 1;
  entrada.criterioConsumoElevado.periodo.hasta = "2026-10-02T00:00:00.000Z";

  const resultado = await repositorio.obtenerDatos("SUM-NORMAL", PERIODO_DEMO);
  assert.ok(resultado);
  assert.equal(resultado.versionDatos, "demo-v1");
  assert.equal(resultado.lecturas[0].valor, 1.25);
  assert.equal(resultado.tarifa?.precioPorMetroCubicoCentimos, 250);
  assert.deepEqual(resultado.criterioConsumoElevado?.periodo, PERIODO_DEMO);
  assert.equal(Reflect.set(resultado.lecturas[0], "valor", 99), false);
  assert.equal(Reflect.set(resultado.criterioConsumoElevado!.periodo, "hasta", "otra fecha"), false);
  assert.ok(Object.isFrozen(resultado.lecturas));
  const siguiente = await repositorio.obtenerDatos("SUM-NORMAL", PERIODO_DEMO);
  assert.equal(siguiente?.lecturas[0].valor, 1.25);
});

test("selecciona lecturas y configuraciones del periodo y conserva intervalos que cruzan sus límites", async () => {
  const repositorio = new RepositorioAguaEnMemoria(crearDatosSimulados());
  const subperiodo = { desde: PERIODO_DEMO.desde, hasta: "2026-10-01T02:00:00.000Z" };
  const parcial = await repositorio.obtenerDatos("SUM-NORMAL", subperiodo);
  assert.deepEqual(parcial?.lecturas.map((lectura) => lectura.id), ["N1"]);
  assert.ok(parcial?.tarifa);
  assert.equal(parcial?.criterioConsumoElevado, null);

  const cruzado = await repositorio.obtenerDatos("SUM-NORMAL", {
    desde: "2026-10-01T01:00:00.000Z", hasta: "2026-10-01T03:00:00.000Z",
  });
  assert.deepEqual(cruzado?.lecturas.map((lectura) => lectura.id), ["N1", "N2"]);
  const externo = await repositorio.obtenerDatos("SUM-NORMAL", {
    desde: "2026-10-02T00:00:00.000Z", hasta: "2026-10-02T04:00:00.000Z",
  });
  assert.deepEqual(externo?.lecturas, []);
  assert.equal(externo?.tarifa, null);
  assert.equal(externo?.criterioConsumoElevado, null);
  assert.equal(await repositorio.obtenerDatos("desconocido", PERIODO_DEMO), null);
});

test("rechaza instantáneas con suministros mezclados, tipo incoherente o metadatos ambiguos", () => {
  const base = crearDatosSimulados()[0];
  const invalidos: DatosConsultaAgua[] = [
    { ...base, versionDatos: " " },
    { ...base, tipoMedicion: "acumulada" },
    { ...base, lecturas: [{ ...base.lecturas[0], suministroId: "OTRO" }] },
    { ...base, tarifa: { ...base.tarifa!, suministroId: "OTRO" } },
    { ...base, criterioConsumoElevado: { ...base.criterioConsumoElevado!, suministroId: "OTRO" } },
  ];
  for (const entrada of invalidos) {
    assert.throws(() => new RepositorioAguaEnMemoria([entrada]));
  }
  assert.throws(() => new RepositorioAguaEnMemoria([base, base]));
});

test("la fuente simulada y los adaptadores producen un resumen normal con costo y sin alerta", async () => {
  const resultado = await consultar("SUM-NORMAL");
  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.versionDatos, "demo-v1");
  assert.equal(resultado.consumo.estado, "calculado");
  assert.equal(resultado.consumo.consumoLitros, 2000);
  assert.equal(resultado.costo.estado, "estimado");
  assert.equal(resultado.costo.importeCentimos, 500);
  assert.equal(resultado.consumoElevado.estado, "sin_alerta");
  const texto = formatearResumen(resultado);
  assert.match(texto, /2000 L \(2 m3\)/);
  assert.match(texto, /S\/ 5\.00/);
  assert.match(texto, /demo-v1/);
  assert.match(texto, /Cobertura: completa/);
});

test("la demostración calcula consumo elevado acumulado y presenta las lecturas revisadas", async () => {
  const resultado = await consultar("SUM-ELEVADO");
  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.consumo.estado, "calculado");
  assert.equal(resultado.consumo.consumoLitros, 3000);
  assert.ok("lecturasRevisadas" in resultado.consumo);
  assert.deepEqual(resultado.consumo.lecturasRevisadas, ["E1", "E2", "E3"]);
  assert.equal(resultado.costo.estado, "estimado");
  assert.equal(resultado.costo.importeCentimos, 750);
  assert.equal(resultado.consumoElevado.estado, "alerta");
  assert.match(formatearResumen(resultado), /Lecturas revisadas: E1, E2, E3/);
});

test("la demostración muestra consumo parcial, huecos, costo incompleto y alerta no evaluable", async () => {
  const resultado = await consultar("SUM-INCOMPLETO");
  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.consumo.estado, "incompleto");
  assert.equal(resultado.consumo.consumoLitros, 1000);
  assert.equal(resultado.consumo.tramosSinDatos.length, 2);
  assert.equal(resultado.costo.estado, "incompleto");
  assert.equal(resultado.costo.importeCentimos, 250);
  assert.equal(resultado.consumoElevado.estado, "no_evaluable");
  const texto = formatearResumen(resultado);
  assert.match(texto, /Cobertura: incompleta/);
  assert.match(texto, /S\/ 2\.50 \(incompleto\)/);
  assert.equal(texto.match(/Tramo sin datos:/g)?.length, 2);
});

test("una identidad ficticia sin permiso recibe una denegación sin consumo ni costo", async () => {
  const resultado = await preparar().ejecutar({ usuarioId: "USU-SIN-ACCESO" }, {
    suministroId: "SUM-ELEVADO", periodo: PERIODO_DEMO,
  });
  assert.equal(resultado.estado, "no_autorizado");
  const texto = formatearResumen(resultado);
  assert.match(texto, /no_autorizado/);
  assert.doesNotMatch(texto, /3000|7\.50|Versión de datos|Lecturas utilizadas/);
});
