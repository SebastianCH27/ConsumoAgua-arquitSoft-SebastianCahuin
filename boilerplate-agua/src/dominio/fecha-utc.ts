export function validarFecha(valor: unknown, campo: string): number {
  if (typeof valor !== "string") {
    throw new Error(`El campo ${campo} debe ser una fecha ISO en UTC.`);
  }

  const fecha = new Date(valor);

  if (!Number.isFinite(fecha.getTime()) || fecha.toISOString() !== valor) {
    throw new Error(`El campo ${campo} debe ser una fecha ISO en UTC.`);
  }

  return fecha.getTime();
}