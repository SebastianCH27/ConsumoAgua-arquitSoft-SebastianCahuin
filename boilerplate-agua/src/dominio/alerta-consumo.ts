import type { ResultadoConsumoPeriodoIntervalos } from "./consumo-periodo-intervalos.js";
import type { ResultadoConsumoPeriodoAcumulado } from "./consumo-periodo-acumulado.js";
import { crearPeriodo } from "./periodo-consumo.js";
import type { PeriodoConsumo } from "./periodo-consumo.js";
import { convertirConsumo } from "./unidades-consumo.js";
import type { UnidadConsumo } from "./unidades-consumo.js";
import { representarCantidadEnLitros, obtenerUnidadesConsumo } from "./calculo-decimal.js";

export interface CriterioConsumoElevado {
  readonly id: string;
  readonly version: string;
  readonly suministroId: string;
  readonly periodo: PeriodoConsumo;
  readonly limite: number;
  readonly unidad: UnidadConsumo;
  readonly activo: boolean;
}

export type ResultadoEvaluacionConsumo =
  | {
      readonly estado: "alerta" | "sin_alerta";
      readonly suministroId: string;
      readonly periodo: PeriodoConsumo;
      readonly consumoLitros: number;
      readonly limiteLitros: number;
      readonly criterio: CriterioConsumoElevado;
      readonly lecturasUsadas: readonly string[];
      readonly lecturasRevisadas: readonly string[];
      readonly motivo: string;
    }
  | { readonly estado: "no_evaluable"; readonly motivo: string };

// Recibe resultados de nuestras funciones de consumo por periodo.
export function evaluarConsumoElevado(
  consumo: ResultadoConsumoPeriodoIntervalos | ResultadoConsumoPeriodoAcumulado,
  criterio: CriterioConsumoElevado | null,
): ResultadoEvaluacionConsumo {
  try {
    if (consumo.estado === "no_calculable") {
      throw new Error(consumo.motivo);
    }

    if (consumo.estado === "incompleto") {
      throw new Error("Esta regla requiere un periodo con consumo completo.");
    }

    const aplicado = crearCriterioConsumoElevado(criterio);

    if (!aplicado.activo) {
      throw new Error("El criterio de consumo elevado está desactivado.");
    }

    if (aplicado.suministroId !== consumo.suministroId) {
      throw new Error("El criterio corresponde a otro suministro.");
    }

    const periodo = crearPeriodo(consumo.periodo);

    if (
      periodo.desde !== aplicado.periodo.desde ||
      periodo.hasta !== aplicado.periodo.hasta
    ) {
      throw new Error("El criterio corresponde a otro periodo.");
    }

    const cantidad = representarCantidadEnLitros(aplicado.limite, aplicado.unidad);
    const limite = obtenerUnidadesConsumo(cantidad.entero, cantidad.exponente);

    if (limite === null) {
      throw new Error("El límite supera el rango numérico admitido.");
    }

    const consumoLitros = convertirConsumo(consumo.consumoLitros, "L", "L");
    const supera = consumoLitros > limite.litros;

    return Object.freeze({
      estado: supera ? "alerta" : "sin_alerta",
      suministroId: consumo.suministroId,
      periodo,
      consumoLitros,
      limiteLitros: limite.litros,
      criterio: aplicado,
      lecturasUsadas: Object.freeze([...consumo.lecturasUsadas]),
      lecturasRevisadas: Object.freeze([
        ...("lecturasRevisadas" in consumo
          ? consumo.lecturasRevisadas
          : consumo.lecturasUsadas),
      ]),
      motivo: supera
        ? "El consumo supera el límite configurado para este periodo."
        : "El consumo no supera el límite configurado para este periodo.",
    });
  } catch (error) {
    return {
      estado: "no_evaluable",
      motivo: error instanceof Error ? error.message : "Datos inválidos.",
    };
  }
}

export function crearCriterioConsumoElevado(
  datos: CriterioConsumoElevado | null,
): CriterioConsumoElevado {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("Se requiere un criterio de consumo elevado con sus datos.");
  }

  for (const campo of ["id", "version", "suministroId"] as const) {
    if (typeof datos[campo] !== "string" || datos[campo].trim().length === 0) {
      throw new Error(`El campo ${campo} debe contener texto no vacío.`);
    }
  }

  if (typeof datos.activo !== "boolean") {
    throw new Error("El estado activo del criterio debe ser verdadero o falso.");
  }

  convertirConsumo(datos.limite, datos.unidad, datos.unidad);

  return Object.freeze({ ...datos, periodo: crearPeriodo(datos.periodo) });
}
