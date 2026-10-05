import { validarFecha } from "./fecha-utc.js";

export interface PeriodoConsumo {
  readonly desde: string;
  readonly hasta: string;
}

export interface ResultadoCoberturaPeriodo {
  readonly estado: "completo" | "incompleto";
  readonly periodo: PeriodoConsumo;
  readonly tramosSinDatos: readonly PeriodoConsumo[];
}

export function crearPeriodo(datos: PeriodoConsumo): PeriodoConsumo {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("El periodo debe ser un objeto con sus fechas.");
  }

  const inicio = validarFecha(datos.desde, "desde");
  const fin = validarFecha(datos.hasta, "hasta");

  if (inicio >= fin) {
    throw new Error("El inicio del periodo debe ser anterior a su fin.");
  }

  return Object.freeze({ desde: datos.desde, hasta: datos.hasta });
}

// Evalúa cobertura temporal; no suma ni prorratea consumos.
export function evaluarCoberturaPeriodo(
  periodo: PeriodoConsumo,
  tramosDisponibles: readonly PeriodoConsumo[],
): ResultadoCoberturaPeriodo {
  const solicitado = crearPeriodo(periodo);

  if (!Array.isArray(tramosDisponibles)) {
    throw new Error("Los tramos disponibles deben ser una lista.");
  }

  const inicio = Date.parse(solicitado.desde);
  const fin = Date.parse(solicitado.hasta);

  const ordenados = Array.from(tramosDisponibles, crearPeriodo)
    .map((tramo) => ({
      inicio: Date.parse(tramo.desde),
      fin: Date.parse(tramo.hasta),
    }))
    .sort((a, b) => a.inicio - b.inicio);

  const tramosSinDatos: PeriodoConsumo[] = [];
  let cubiertoHasta = inicio;

  for (const tramo of ordenados) {
    const desde = Math.max(inicio, tramo.inicio);
    const hasta = Math.min(fin, tramo.fin);

    if (hasta <= cubiertoHasta || desde >= fin) {
      continue;
    }

    if (desde > cubiertoHasta) {
      tramosSinDatos.push(tramoEntre(cubiertoHasta, desde));
    }

    cubiertoHasta = hasta;

    if (cubiertoHasta === fin) {
      break;
    }
  }

  if (cubiertoHasta < fin) {
    tramosSinDatos.push(tramoEntre(cubiertoHasta, fin));
  }

  return Object.freeze({
    estado: tramosSinDatos.length === 0 ? "completo" : "incompleto",
    periodo: solicitado,
    tramosSinDatos: Object.freeze(tramosSinDatos),
  });
}

function tramoEntre(desde: number, hasta: number): PeriodoConsumo {
  return Object.freeze({
    desde: new Date(desde).toISOString(),
    hasta: new Date(hasta).toISOString(),
  });
}