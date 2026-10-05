import { convertirConsumo } from "./unidades-consumo.js";
import type { UnidadConsumo } from "./unidades-consumo.js";

export interface LecturaAgua {
readonly id: string;
readonly suministroId: string;
readonly medidorId?: string;
readonly fuente: string;
readonly fechaMedicion: string;
readonly fechaRecepcion: string;
readonly valor: number;
readonly unidad: UnidadConsumo;
readonly tipo: "acumulada" | "intervalo";
readonly fechaInicioIntervalo?: string;
}

export function crearLectura(datos: LecturaAgua): LecturaAgua {
if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("La lectura debe ser un objeto con sus datos.");
}

for (const campo of ["id", "suministroId", "fuente"] as const) {
    validarTexto(datos[campo], campo);
}

if (datos.medidorId !== undefined) {
    validarTexto(datos.medidorId, "medidorId");
}

convertirConsumo(datos.valor, datos.unidad, datos.unidad);

const fin = validarFecha(datos.fechaMedicion, "fechaMedicion");
validarFecha(datos.fechaRecepcion, "fechaRecepcion");

if (datos.tipo !== "acumulada" && datos.tipo !== "intervalo") {
    throw new Error("El tipo de lectura debe ser acumulada o intervalo.");
}

if (datos.tipo === "intervalo") {
    const inicio = validarFecha(datos.fechaInicioIntervalo, "fechaInicioIntervalo");

    if (inicio >= fin) {
    throw new Error("El inicio del intervalo debe ser anterior a su fin.");
    }
} else if (datos.fechaInicioIntervalo !== undefined) {
    throw new Error("Una lectura acumulada no debe tener inicio de intervalo.");
}

return Object.freeze({ ...datos });
}

function validarTexto(valor: unknown, campo: string): void {
if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new Error(`El campo ${campo} debe contener texto no vacío.`);
}
}

function validarFecha(valor: unknown, campo: string): number {
if (typeof valor !== "string") {
    throw new Error(`El campo ${campo} debe ser una fecha ISO en UTC.`);
}

const fecha = new Date(valor);

if (!Number.isFinite(fecha.getTime()) || fecha.toISOString() !== valor) {
    throw new Error(`El campo ${campo} debe ser una fecha ISO en UTC.`);
}

return fecha.getTime();
}
