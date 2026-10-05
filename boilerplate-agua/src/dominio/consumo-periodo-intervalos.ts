import { crearLectura } from "./lectura-agua.js";
import type { LecturaAgua } from "./lectura-agua.js";
import { calcularConsumoIntervalos } from "./consumo-intervalos.js";
import { crearPeriodo, evaluarCoberturaPeriodo } from "./periodo-consumo.js";
import type { PeriodoConsumo } from "./periodo-consumo.js";

export type ResultadoConsumoPeriodoIntervalos =
  | {
      estado: "calculado" | "incompleto";
      suministroId: string;
      periodo: PeriodoConsumo;
      desde: string;
      hasta: string;
      consumoLitros: number;
      consumoMetrosCubicos: number;
      lecturasUsadas: readonly string[];
      tramosSinDatos: readonly PeriodoConsumo[];
    }
  | { estado: "no_calculable"; motivo: string };

export function calcularConsumoPeriodoIntervalos(
  periodo: PeriodoConsumo,
  lecturas: readonly LecturaAgua[],
): ResultadoConsumoPeriodoIntervalos {
  let solicitado: PeriodoConsumo;
  let datos: LecturaAgua[];

  try {
    solicitado = crearPeriodo(periodo);

    if (!Array.isArray(lecturas)) {
      throw new Error("Las lecturas deben ser una lista.");
    }

    datos = Array.from(lecturas, crearLectura);
  } catch (error) {
    return noCalculable(
      error instanceof Error ? error.message : "Datos inválidos.",
    );
  }

  if (datos.some((lectura) => lectura.tipo !== "intervalo")) {
    return noCalculable(
      "Todas las lecturas deben representar consumos por intervalo.",
    );
  }

  const inicio = Date.parse(solicitado.desde);
  const fin = Date.parse(solicitado.hasta);

  const seleccionadas = datos.filter((lectura) =>
    Date.parse(lectura.fechaInicioIntervalo!) < fin &&
    Date.parse(lectura.fechaMedicion) > inicio
  );

  if (seleccionadas.length === 0) {
    return noCalculable(
      "No hay lecturas de consumo por intervalo para el periodo solicitado.",
    );
  }

  if (seleccionadas.some((lectura) =>
    Date.parse(lectura.fechaInicioIntervalo!) < inicio ||
    Date.parse(lectura.fechaMedicion) > fin
  )) {
    return noCalculable(
      "Una lectura cruza los límites del periodo; no se puede asignar su consumo sin datos adicionales.",
    );
  }

  const consumo = calcularConsumoIntervalos(seleccionadas);

  if (consumo.estado === "no_calculable") {
    return consumo;
  }

  const cobertura = evaluarCoberturaPeriodo(
    solicitado,
    seleccionadas.map((lectura) => ({
      desde: lectura.fechaInicioIntervalo!,
      hasta: lectura.fechaMedicion,
    })),
  );

  return {
    estado: cobertura.estado === "completo" ? "calculado" : "incompleto",
    suministroId: consumo.suministroId,
    periodo: solicitado,
    desde: consumo.desde,
    hasta: consumo.hasta,
    consumoLitros: consumo.consumoLitros,
    consumoMetrosCubicos: consumo.consumoMetrosCubicos,
    lecturasUsadas: consumo.lecturasUsadas,
    tramosSinDatos: cobertura.tramosSinDatos,
  };
}

function noCalculable(motivo: string): ResultadoConsumoPeriodoIntervalos {
  return { estado: "no_calculable", motivo };
}