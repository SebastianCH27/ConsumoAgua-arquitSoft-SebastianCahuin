import { validarFecha } from "./fecha-utc.js";

export interface TarifaConsumo {
  readonly id: string;
  readonly version: string;
  readonly suministroId: string;
  readonly moneda: "PEN";
  readonly precioPorMetroCubicoCentimos: number;
  readonly vigenteDesde: string;
  readonly vigenteHasta?: string;
}

export function crearTarifa(datos: TarifaConsumo): TarifaConsumo {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("La tarifa debe ser un objeto con sus datos.");
  }

  for (const campo of ["id", "version", "suministroId"] as const) {
    if (typeof datos[campo] !== "string" || datos[campo].trim().length === 0) {
      throw new Error(`El campo ${campo} debe contener texto no vacío.`);
    }
  }

  if (datos.moneda !== "PEN") {
    throw new Error("La moneda admitida en esta etapa es PEN.");
  }

  const precio = datos.precioPorMetroCubicoCentimos;

  if (typeof precio !== "number" || !Number.isSafeInteger(precio) || precio < 0) {
    throw new Error(
      "El precio debe ser un entero no negativo de céntimos dentro del rango seguro.",
    );
  }

  const inicio = validarFecha(datos.vigenteDesde, "vigenteDesde");

  if (datos.vigenteHasta !== undefined) {
    const fin = validarFecha(datos.vigenteHasta, "vigenteHasta");

    if (fin <= inicio) {
      throw new Error("El fin de vigencia debe ser posterior a su inicio.");
    }
  }

  return Object.freeze({ ...datos });
}