import { crearLectura } from "./lectura-agua.js";
import type { LecturaAgua } from "./lectura-agua.js";

export type ResultadoConsumoAcumulado =
  | {
      estado: "calculado";
      suministroId: string;
      medidorId: string;
      desde: string;
      hasta: string;
      consumoLitros: number;
      consumoMetrosCubicos: number;
      lecturasUsadas: readonly [string, string];
    }
  | { estado: "no_calculable"; motivo: string };

export function calcularConsumoAcumulado(
  anterior: LecturaAgua | null,
  actual: LecturaAgua | null,
): ResultadoConsumoAcumulado {
  if (!anterior || !actual) {
    return noCalculable("Faltan lecturas para calcular el consumo.");
  }

  let inicial: LecturaAgua;
  let final: LecturaAgua;

  try {
    inicial = crearLectura(anterior);
    final = crearLectura(actual);
  } catch (error) {
    return noCalculable(error instanceof Error ? error.message : "Lectura inválida.");
  }

  if (inicial.tipo !== "acumulada" || final.tipo !== "acumulada") {
    return noCalculable("Se requieren dos lecturas acumuladas.");
  }

  if (inicial.suministroId !== final.suministroId || inicial.fuente !== final.fuente) {
    return noCalculable("Las lecturas deben pertenecer al mismo suministro y fuente.");
  }

  if (!inicial.medidorId || inicial.medidorId !== final.medidorId) {
    return noCalculable("No se confirmó que las lecturas correspondan al mismo medidor.");
  }

  if (!inicial.secuenciaMedidorId || inicial.secuenciaMedidorId !== final.secuenciaMedidorId) {
    return noCalculable("No se confirmó la continuidad de la secuencia del medidor.");
  }

  if (inicial.id === final.id) {
    return noCalculable("Se requieren dos registros de lectura distintos.");
  }

  if (Date.parse(final.fechaMedicion) <= Date.parse(inicial.fechaMedicion)) {
    return noCalculable("La lectura final debe ser posterior a la inicial.");
  }

  const inicio = representarEnLitros(inicial);
  const fin = representarEnLitros(final);
  const exponente = Math.min(inicio.exponente, fin.exponente);

  const diferencia =
    fin.entero * 10n ** BigInt(fin.exponente - exponente) -
    inicio.entero * 10n ** BigInt(inicio.exponente - exponente);

  if (diferencia < 0n) {
    return noCalculable("El valor disminuyó; debe revisarse un posible reinicio o corrección.");
  }

  const litros = Number(`${diferencia}e${exponente}`);
  const metrosCubicos = Number(`${diferencia}e${exponente - 3}`);

  if (
    !Number.isFinite(litros) || !Number.isFinite(metrosCubicos) ||
    (diferencia > 0n && (litros === 0 || metrosCubicos === 0))
  ) {
    return noCalculable("El consumo queda fuera del rango numérico admitido.");
  }

  return {
    estado: "calculado",
    suministroId: inicial.suministroId,
    medidorId: inicial.medidorId,
    desde: inicial.fechaMedicion,
    hasta: final.fechaMedicion,
    consumoLitros: litros,
    consumoMetrosCubicos: metrosCubicos,
    lecturasUsadas: [inicial.id, final.id],
  };
}

function noCalculable(motivo: string): ResultadoConsumoAcumulado {
  return { estado: "no_calculable", motivo };
}

function representarEnLitros(lectura: LecturaAgua) {
  const [coeficiente, potencia = "0"] = lectura.valor.toString().split("e");
  const [parteEntera, decimales = ""] = coeficiente.split(".");

  return {
    entero: BigInt(parteEntera + decimales),
    exponente: Number(potencia) - decimales.length + (lectura.unidad === "m3" ? 3 : 0),
  };
}