import { crearLectura } from "./lectura-agua.js";
import type { LecturaAgua } from "./lectura-agua.js";
import { representarEnLitros, obtenerUnidadesConsumo } from "./calculo-decimal.js";

export type ResultadoConsumoIntervalos =
  | {
      estado: "calculado" | "incompleto";
      suministroId: string;
      desde: string;
      hasta: string;
      consumoLitros: number;
      consumoMetrosCubicos: number;
      lecturasUsadas: readonly string[];
      intervalosSinDatos: readonly { desde: string; hasta: string }[];
    }
  | { estado: "no_calculable"; motivo: string };

export function calcularConsumoIntervalos(
  lecturas: readonly LecturaAgua[],
): ResultadoConsumoIntervalos {
  if (!Array.isArray(lecturas) || lecturas.length === 0) {
    return noCalculable("No hay lecturas de consumo por intervalo.");
  }

  let datos: LecturaAgua[];

  try {
    datos = Array.from(lecturas, crearLectura);
  } catch (error) {
    return noCalculable(error instanceof Error ? error.message : "Lectura inválida.");
  }

  if (datos.some((lectura) => lectura.tipo !== "intervalo")) {
    return noCalculable("Todas las lecturas deben representar consumos por intervalo.");
  }

  const referencia = datos[0];

  if (datos.some((lectura) =>
    lectura.suministroId !== referencia.suministroId || lectura.fuente !== referencia.fuente
  )) {
    return noCalculable("Las lecturas deben pertenecer al mismo suministro y fuente.");
  }

  if (new Set(datos.map((lectura) => lectura.id)).size !== datos.length) {
    return noCalculable("Hay registros de lectura duplicados.");
  }

  const ordenadas = datos.sort((a, b) =>
    Date.parse(a.fechaInicioIntervalo!) - Date.parse(b.fechaInicioIntervalo!)
  );

  const intervalosSinDatos: { desde: string; hasta: string }[] = [];

  for (let i = 1; i < ordenadas.length; i++) {
    const anterior = ordenadas[i - 1];
    const actual = ordenadas[i];
    const inicio = Date.parse(actual.fechaInicioIntervalo!);
    const finAnterior = Date.parse(anterior.fechaMedicion);

    if (inicio < finAnterior) {
      return noCalculable("Los intervalos se superponen y podrían duplicar el consumo.");
    }

    if (inicio > finAnterior) {
      intervalosSinDatos.push({
        desde: anterior.fechaMedicion,
        hasta: actual.fechaInicioIntervalo!,
      });
    }
  }

  const cantidades = ordenadas.map(representarEnLitros);

  const exponente = cantidades.reduce(
    (menor, cantidad) => Math.min(menor, cantidad.exponente),
    cantidades[0].exponente,
  );

  const total = cantidades.reduce(
    (suma, cantidad) => suma + cantidad.entero * 10n ** BigInt(cantidad.exponente - exponente),
    0n,
  );

  const consumo = obtenerUnidadesConsumo(total, exponente);

  if (consumo === null) {
    return noCalculable("El consumo queda fuera del rango numérico admitido.");
  }

  return {
    estado: intervalosSinDatos.length === 0 ? "calculado" : "incompleto",
    suministroId: referencia.suministroId,
    desde: ordenadas[0].fechaInicioIntervalo!,
    hasta: ordenadas[ordenadas.length - 1].fechaMedicion,
    consumoLitros: consumo.litros,
    consumoMetrosCubicos: consumo.metrosCubicos,
    lecturasUsadas: ordenadas.map((lectura) => lectura.id),
    intervalosSinDatos,
  };
}

function noCalculable(motivo: string): ResultadoConsumoIntervalos {
  return { estado: "no_calculable", motivo };
}