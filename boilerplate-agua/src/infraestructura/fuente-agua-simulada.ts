import type { DatosConsultaAgua } from "../aplicacion/contratos-consulta.js";
import type { LecturaAgua } from "../dominio/lectura-agua.js";
import { crearPeriodo } from "../dominio/periodo-consumo.js";

export const PERIODO_DEMO = crearPeriodo({
  desde: "2026-10-01T00:00:00.000Z",
  hasta: "2026-10-01T04:00:00.000Z",
});

const fecha = (hora: string) => `2026-10-01T${hora}:00.000Z`;

// Fuente local de datos ficticios para iniciar el repositorio de la demo.
// No realiza peticiones HTTP ni sustituye una API real en producción.
export function crearDatosSimulados(): DatosConsultaAgua[] {
  function intervalo(
    suministroId: string, id: string, valor: number, inicio: string, fin: string,
  ): LecturaAgua {
    return {
      id, suministroId, fuente: "empresa-agua-simulada", tipo: "intervalo",
      valor, unidad: "m3", fechaInicioIntervalo: fecha(inicio),
      fechaMedicion: fecha(fin), fechaRecepcion: fecha("06:00"),
    };
  }

  const normal = "SUM-NORMAL";
  const elevado = "SUM-ELEVADO";
  const incompleto = "SUM-INCOMPLETO";
  const suministros = [normal, elevado, incompleto];
  const lecturas: LecturaAgua[][] = [
    [intervalo(normal, "N1", 1.25, "00:00", "02:00"),
      intervalo(normal, "N2", 0.75, "02:00", "04:00")],
    [100, 101, 103].map((valor, indice) => ({
      id: `E${indice + 1}`, suministroId: elevado, fuente: "empresa-agua-simulada",
      tipo: "acumulada", medidorId: "MED-DEMO", secuenciaMedidorId: "SEC-DEMO",
      valor, unidad: "m3", fechaMedicion: fecha(["00:00", "02:00", "04:00"][indice]),
      fechaRecepcion: fecha("06:00"),
    })),
    [intervalo(incompleto, "P1", 1, "01:00", "03:00")],
  ];

  return suministros.map((suministroId, indice) => ({
    suministroId, versionDatos: "demo-v1",
    tipoMedicion: indice === 1 ? "acumulada" : "intervalo",
    lecturas: lecturas[indice],
    tarifa: {
      id: `T-${suministroId}`, version: "tarifa-demo-v1", suministroId,
      moneda: "PEN", precioPorMetroCubicoCentimos: 250,
      vigenteDesde: PERIODO_DEMO.desde, vigenteHasta: PERIODO_DEMO.hasta,
    },
    criterioConsumoElevado: {
      id: `C-${suministroId}`, version: "criterio-demo-v1", suministroId,
      periodo: { ...PERIODO_DEMO }, limite: 2500, unidad: "L", activo: true,
    },
  }));
}
