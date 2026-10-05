import type { LecturaAgua } from "./lectura-agua.js";
import type { UnidadConsumo } from "./unidades-consumo.js";

export interface CantidadDecimal {
  readonly entero: bigint;
  readonly exponente: number;
}

export function representarEnLitros(lectura: LecturaAgua): CantidadDecimal {
  return representarCantidadEnLitros(lectura.valor, lectura.unidad);
}

// Los valores y las unidades deben validarse antes de usar esta representación.
export function representarCantidadEnLitros(
  valor: number,
  unidad: UnidadConsumo,
): CantidadDecimal {
  const [coeficiente, potencia = "0"] = valor.toString().split("e");
  const [parteEntera, decimales = ""] = coeficiente.split(".");

  return {
    entero: BigInt(parteEntera + decimales),
    exponente: Number(potencia) - decimales.length + (unidad === "m3" ? 3 : 0),
  };
}

export function obtenerUnidadesConsumo(
  entero: bigint,
  exponente: number,
): { litros: number; metrosCubicos: number } | null {
  const litros = Number(`${entero}e${exponente}`);
  const metrosCubicos = Number(`${entero}e${exponente - 3}`);

  if (
    entero < 0n ||
    !Number.isFinite(litros) || !Number.isFinite(metrosCubicos) ||
    (entero > 0n && (litros === 0 || metrosCubicos === 0))
  ) {
    return null;
  }

  return { litros, metrosCubicos };
}
