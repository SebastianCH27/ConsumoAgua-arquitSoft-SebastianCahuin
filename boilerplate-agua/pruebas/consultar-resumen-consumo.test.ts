import assert from "node:assert/strict";
import { test } from "node:test";
import { ConsultarResumenConsumo } from "../src/aplicacion/consultar-resumen-consumo.js";
import type {
  AutorizacionConsulta, DatosConsultaAgua, RepositorioConsultaAgua,
} from "../src/aplicacion/contratos-consulta.js";
import type { LecturaAgua } from "../src/dominio/lectura-agua.js";

const fecha = (hora: string) => `2026-10-01T${hora}:00.000Z`;
const periodo = { desde: fecha("00:00"), hasta: fecha("04:00") };
const contexto = { usuarioId: "USU-001" };
const solicitud = { suministroId: "SUM-001", periodo };

function lectura(valor = 3, inicio = "00:00", fin = "04:00"): LecturaAgua {
  return {
    id: "I1", suministroId: "SUM-001", fuente: "empresa-simulada",
    fechaInicioIntervalo: fecha(inicio), fechaMedicion: fecha(fin),
    fechaRecepcion: fecha("06:00"), valor, unidad: "m3", tipo: "intervalo",
  };
}

function datos(cambios: Partial<DatosConsultaAgua> = {}): DatosConsultaAgua {
  return {
    suministroId: "SUM-001", versionDatos: "datos-v1", tipoMedicion: "intervalo",
    lecturas: [lectura()],
    tarifa: {
      id: "T-001", version: "v1", suministroId: "SUM-001", moneda: "PEN",
      precioPorMetroCubicoCentimos: 250, vigenteDesde: periodo.desde,
      vigenteHasta: periodo.hasta,
    },
    criterioConsumoElevado: {
      id: "CE-001", version: "v1", suministroId: "SUM-001",
      periodo, limite: 2000, unidad: "L", activo: true,
    },
    ...cambios,
  };
}

function preparar(informacion: DatosConsultaAgua | null = datos(), permitido = true) {
  const llamadas: string[] = [];
  const autorizacion: AutorizacionConsulta = {
    async puedeConsultar(usuarioId, suministroId) {
      llamadas.push(`autorizar:${usuarioId}:${suministroId}`);
      return permitido;
    },
  };
  const repositorio: RepositorioConsultaAgua = {
    async obtenerDatos(suministroId, solicitado) {
      llamadas.push(`leer:${suministroId}`);
      assert.deepEqual(solicitado, periodo);
      return informacion;
    },
  };
  return { caso: new ConsultarResumenConsumo(autorizacion, repositorio), llamadas };
}

test("coordina autorización, consumo, costo y consumo elevado en una consulta", async () => {
  const { caso, llamadas } = preparar();
  const resultado = await caso.ejecutar(contexto, solicitud);

  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.suministroId, "SUM-001");
  assert.equal(resultado.versionDatos, "datos-v1");
  assert.deepEqual(resultado.periodo, periodo);
  assert.equal(resultado.consumo.estado, "calculado");
  assert.equal(resultado.consumo.consumoLitros, 3000);
  assert.equal(resultado.costo.estado, "estimado");
  assert.equal(resultado.costo.importeCentimos, 750);
  assert.equal(resultado.consumoElevado.estado, "alerta");
  assert.deepEqual(llamadas, ["autorizar:USU-001:SUM-001", "leer:SUM-001"]);
});

test("coordina el resumen de lecturas acumuladas y conserva su trazabilidad", async () => {
  const lecturas = [100, 101, 103].map((valor, i): LecturaAgua => ({
    id: `L${i + 1}`, suministroId: "SUM-001", fuente: "empresa-simulada",
    medidorId: "MED-001", secuenciaMedidorId: "SEC-001",
    fechaMedicion: fecha(["00:00", "02:00", "04:00"][i]),
    fechaRecepcion: fecha("06:00"), valor, unidad: "m3", tipo: "acumulada",
  }));
  const { caso } = preparar(datos({ tipoMedicion: "acumulada", lecturas }));
  const resultado = await caso.ejecutar(contexto, solicitud);

  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.consumo.estado, "calculado");
  assert.equal(resultado.consumo.consumoLitros, 3000);
  assert.ok("lecturasRevisadas" in resultado.consumo);
  assert.deepEqual(resultado.consumo.lecturasRevisadas, ["L1", "L2", "L3"]);
  assert.equal(resultado.costo.estado, "estimado");
  assert.equal(resultado.costo.importeCentimos, 750);
  assert.equal(resultado.consumoElevado.estado, "alerta");
});

test("RF03: una consulta sin permiso no recupera ni expone información", async () => {
  const { caso, llamadas } = preparar(datos(), false);
  const resultado = await caso.ejecutar(contexto, solicitud);

  assert.equal(resultado.estado, "no_autorizado");
  assert.deepEqual(llamadas, ["autorizar:USU-001:SUM-001"]);
  assert.ok(!("consumo" in resultado));
  assert.ok(!("costo" in resultado));
});

test("rechaza solicitudes inválidas antes de consultar los contratos", async () => {
  const { caso, llamadas } = preparar();
  const casos = [
    { contexto: { usuarioId: " " }, solicitud },
    { contexto, solicitud: { ...solicitud, suministroId: "" } },
    { contexto, solicitud: { ...solicitud, periodo: { ...periodo, hasta: "sin fecha" } } },
    { contexto, solicitud: { ...solicitud, periodo: { desde: periodo.hasta, hasta: periodo.desde } } },
  ];
  for (const entrada of casos) {
    const resultado = await caso.ejecutar(entrada.contexto, entrada.solicitud);
    assert.equal(resultado.estado, "solicitud_invalida");
  }
  assert.deepEqual(llamadas, []);
});

test("distingue un suministro no disponible de una consulta autorizada con datos", async () => {
  const { caso, llamadas } = preparar(null);
  const resultado = await caso.ejecutar(contexto, solicitud);

  assert.equal(resultado.estado, "no_disponible");
  assert.deepEqual(llamadas, ["autorizar:USU-001:SUM-001", "leer:SUM-001"]);
  assert.ok(!("consumo" in resultado));
});

test("rechaza datos de otro suministro o sin metadatos válidos", async () => {
  for (const cambios of [
    { suministroId: "SUM-002" },
    { lecturas: [{ ...lectura(), suministroId: "SUM-002" }] },
    { versionDatos: " " },
    { tipoMedicion: "desconocido" as unknown as "intervalo" },
  ]) {
    const { caso } = preparar(datos(cambios));
    const resultado = await caso.ejecutar(contexto, solicitud);
    assert.equal(resultado.estado, "error");
    assert.ok(!("consumo" in resultado));
  }
});

test("conserva la falta de lecturas o configuraciones sin inventar importes", async () => {
  const { caso: sinLecturas } = preparar(datos({ lecturas: [] }));
  const vacio = await sinLecturas.ejecutar(contexto, solicitud);
  assert.equal(vacio.estado, "consultado");
  assert.equal(vacio.consumo.estado, "no_calculable");
  assert.equal(vacio.costo.estado, "no_estimable");
  assert.equal(vacio.consumoElevado.estado, "no_evaluable");

  const { caso: sinConfiguracion } = preparar(datos({ tarifa: null, criterioConsumoElevado: null }));
  const resultado = await sinConfiguracion.ejecutar(contexto, solicitud);
  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.consumo.estado, "calculado");
  assert.equal(resultado.costo.estado, "no_estimable");
  assert.equal(resultado.consumoElevado.estado, "no_evaluable");
});

test("conserva el consumo y costo parciales y la evaluación no disponible", async () => {
  const { caso } = preparar(datos({ lecturas: [lectura(1, "01:00", "03:00")] }));
  const resultado = await caso.ejecutar(contexto, solicitud);

  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.consumo.estado, "incompleto");
  assert.equal(resultado.consumo.consumoLitros, 1000);
  assert.equal(resultado.costo.estado, "incompleto");
  assert.equal(resultado.costo.importeCentimos, 250);
  assert.equal(resultado.consumoElevado.estado, "no_evaluable");
});

test("los fallos de los contratos no exponen detalles internos ni permiten seguir", async () => {
  let lecturas = 0;
  const autorizacion: AutorizacionConsulta = { async puedeConsultar() { return true; } };
  const repositorio: RepositorioConsultaAgua = {
    async obtenerDatos() { lecturas++; throw new Error("DETALLE-INTERNO-REPOSITORIO"); },
  };
  const falloLectura = await new ConsultarResumenConsumo(autorizacion, repositorio).ejecutar(contexto, solicitud);
  assert.equal(falloLectura.estado, "error");
  assert.doesNotMatch(falloLectura.motivo, /DETALLE-INTERNO/);
  assert.equal(lecturas, 1);

  const falloPermiso = await new ConsultarResumenConsumo({
    async puedeConsultar() { throw new Error("DETALLE-INTERNO-AUTORIZACION"); },
  }, repositorio).ejecutar(contexto, solicitud);
  assert.equal(falloPermiso.estado, "error");
  assert.doesNotMatch(falloPermiso.motivo, /DETALLE-INTERNO/);
  assert.equal(lecturas, 1);
});

test("conserva usuario, suministro y periodo aunque las entradas cambien durante la consulta", async () => {
  const identidad = { ...contexto };
  const entrada = { suministroId: "SUM-001", periodo: { ...periodo } };
  const autorizacion: AutorizacionConsulta = {
    async puedeConsultar(usuarioId, suministroId) {
      assert.equal(usuarioId, "USU-001");
      assert.equal(suministroId, "SUM-001");
      identidad.usuarioId = "USU-002";
      entrada.suministroId = "SUM-002";
      entrada.periodo.hasta = fecha("05:00");
      return true;
    },
  };
  const repositorio: RepositorioConsultaAgua = {
    async obtenerDatos(suministroId, solicitado) {
      assert.equal(suministroId, "SUM-001");
      assert.deepEqual(solicitado, periodo);
      return datos();
    },
  };
  const resultado = await new ConsultarResumenConsumo(autorizacion, repositorio).ejecutar(identidad, entrada);
  assert.equal(resultado.estado, "consultado");
  assert.equal(resultado.suministroId, "SUM-001");
  assert.deepEqual(resultado.periodo, periodo);
});
