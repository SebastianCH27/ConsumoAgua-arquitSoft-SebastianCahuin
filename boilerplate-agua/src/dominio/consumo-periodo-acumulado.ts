import { crearLectura } from "./lectura-agua.js";
import type { LecturaAgua } from "./lectura-agua.js";
import { calcularConsumoAcumulado } from "./consumo-acumulado.js";
import { crearPeriodo, evaluarCoberturaPeriodo } from "./periodo-consumo.js";
import type { PeriodoConsumo } from "./periodo-consumo.js";

export type ResultadoConsumoPeriodoAcumulado =
  | {
      estado: "calculado" | "incompleto";
      suministroId: string;
      medidorId: string;
      periodo: PeriodoConsumo;
      desde: string;
      hasta: string;
      consumoLitros: number;
      consumoMetrosCubicos: number;
      lecturasUsadas: readonly [string, string];
      lecturasRevisadas: readonly string[];
      tramosSinDatos: readonly PeriodoConsumo[];
    }
  | { estado: "no_calculable"; motivo: string };

export function calcularConsumoPeriodoAcumulado(
  periodo: PeriodoConsumo,
  lecturas: readonly LecturaAgua[],
): ResultadoConsumoPeriodoAcumulado {
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

  if (datos.some((lectura) => lectura.tipo !== "acumulada")) {
    return noCalculable("Todas las lecturas deben ser acumuladas.");
  }

  const inicio = Date.parse(solicitado.desde);
  const fin = Date.parse(solicitado.hasta);

  const ordenadas = datos
    .filter((lectura) => {
      const fecha = Date.parse(lectura.fechaMedicion);
      return fecha >= inicio && fecha <= fin;
    })
    .sort((a, b) =>
      Date.parse(a.fechaMedicion) - Date.parse(b.fechaMedicion)
    );

  if (ordenadas.length < 2) {
    return noCalculable(
      "Se requieren al menos dos lecturas dentro del periodo solicitado.",
    );
  }

  if (new Set(ordenadas.map((lectura) => lectura.id)).size !== ordenadas.length) {
    return noCalculable("Hay registros de lectura duplicados en el periodo.");
  }

  for (let i = 1; i < ordenadas.length; i++) {
    const tramo = calcularConsumoAcumulado(
      ordenadas[i - 1],
      ordenadas[i],
    );

    if (tramo.estado === "no_calculable") {
      return tramo;
    }
  }

  const consumo = calcularConsumoAcumulado(
    ordenadas[0],
    ordenadas[ordenadas.length - 1],
  );

  if (consumo.estado === "no_calculable") {
    return consumo;
  }

  const cobertura = evaluarCoberturaPeriodo(solicitado, [{
    desde: consumo.desde,
    hasta: consumo.hasta,
  }]);

  return {
    estado: cobertura.estado === "completo" ? "calculado" : "incompleto",
    suministroId: consumo.suministroId,
    medidorId: consumo.medidorId,
    periodo: solicitado,
    desde: consumo.desde,
    hasta: consumo.hasta,
    consumoLitros: consumo.consumoLitros,
    consumoMetrosCubicos: consumo.consumoMetrosCubicos,
    lecturasUsadas: consumo.lecturasUsadas,
    lecturasRevisadas: ordenadas.map((lectura) => lectura.id),
    tramosSinDatos: cobertura.tramosSinDatos,
  };
}

function noCalculable(motivo: string): ResultadoConsumoPeriodoAcumulado {
  return { estado: "no_calculable", motivo };
}