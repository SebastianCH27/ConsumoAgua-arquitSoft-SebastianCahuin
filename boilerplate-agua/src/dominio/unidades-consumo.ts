export type UnidadConsumo = "L" | "m3";

export function convertirConsumo(
  valor: number,
  origen: UnidadConsumo,
  destino: UnidadConsumo,
): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error("El consumo debe ser un número finito.");
  }

  if (valor < 0) {
    throw new Error("El consumo no puede ser negativo.");
  }

  if (
    (origen !== "L" && origen !== "m3") ||
    (destino !== "L" && destino !== "m3")
  ) {
    throw new Error("La unidad debe ser L o m3.");
  }

  const factor = origen === destino ? 1 : origen === "m3" ? 1000 : 1 / 1000;
  const resultado = valor * factor;

  if (!Number.isFinite(resultado)) {
    throw new Error("El resultado supera el rango numérico admitido.");
  }

  return resultado;
}