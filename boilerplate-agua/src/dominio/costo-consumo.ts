import type { ResultadoConsumoPeriodoIntervalos } from "./consumo-periodo-intervalos.js";
import type { ResultadoConsumoPeriodoAcumulado } from "./consumo-periodo-acumulado.js";
import { crearPeriodo } from "./periodo-consumo.js";
import { crearTarifa } from "./tarifa-consumo.js";
import type { TarifaConsumo } from "./tarifa-consumo.js";
import { convertirConsumo } from "./unidades-consumo.js";

type ResultadoConsumo =
  | ResultadoConsumoPeriodoIntervalos
  | ResultadoConsumoPeriodoAcumulado;

type ConsumoCalculado = Exclude<ResultadoConsumo, { estado: "no_calculable" }>;

export type ResultadoCostoConsumo =
  | {
      readonly estado: "estimado" | "incompleto";
      readonly moneda: "PEN";
      readonly importeCentimos: number;
      readonly consumo: ConsumoCalculado;
      readonly tarifa: TarifaConsumo;
      readonly conceptosIncluidos: readonly ["Consumo de agua"];
    }
  | { readonly estado: "no_estimable"; readonly motivo: string };

// Recibe resultados de nuestras funciones de consumo por periodo.
export function estimarCostoConsumo(
  consumo: ResultadoConsumo,
  tarifa: TarifaConsumo | null,
): ResultadoCostoConsumo {
  try {
    if (consumo.estado === "no_calculable") {
      throw new Error(consumo.motivo);
    }

    if (tarifa === null || tarifa === undefined) {
      throw new Error("No hay una tarifa disponible para estimar el costo.");
    }

    const aplicada = crearTarifa(tarifa);
    const tramo = crearPeriodo({ desde: consumo.desde, hasta: consumo.hasta });

    if (aplicada.suministroId !== consumo.suministroId) {
      throw new Error("La tarifa corresponde a otro suministro.");
    }

    if (
      Date.parse(aplicada.vigenteDesde) > Date.parse(tramo.desde) ||
      (aplicada.vigenteHasta !== undefined &&
        Date.parse(aplicada.vigenteHasta) < Date.parse(tramo.hasta))
    ) {
      throw new Error("La tarifa no cubre todo el tramo conocido del consumo.");
    }

    const metrosCubicos = convertirConsumo(
      consumo.consumoMetrosCubicos, "m3", "m3",
    );
    const importeCentimos = calcularImporteCentimos(
      metrosCubicos, aplicada.precioPorMetroCubicoCentimos,
    );

    const base = {
      ...consumo,
      periodo: crearPeriodo(consumo.periodo),
      tramosSinDatos: Object.freeze(consumo.tramosSinDatos.map(crearPeriodo)),
    };

    const copia: ConsumoCalculado = "lecturasRevisadas" in consumo
      ? Object.freeze({
          ...base,
          medidorId: consumo.medidorId,
          lecturasUsadas: Object.freeze([
            consumo.lecturasUsadas[0], consumo.lecturasUsadas[1],
          ] as const),
          lecturasRevisadas: Object.freeze([...consumo.lecturasRevisadas]),
        })
      : Object.freeze({
          ...base,
          lecturasUsadas: Object.freeze([...consumo.lecturasUsadas]),
        });

    return Object.freeze({
      estado: consumo.estado === "calculado" ? "estimado" : "incompleto",
      moneda: aplicada.moneda,
      importeCentimos,
      consumo: copia,
      tarifa: aplicada,
      conceptosIncluidos: Object.freeze(["Consumo de agua"] as const),
    });
  } catch (error) {
    return {
      estado: "no_estimable",
      motivo: error instanceof Error ? error.message : "Datos inválidos.",
    };
  }
}

function calcularImporteCentimos(metrosCubicos: number, precio: number): number {
  const [coeficiente, potencia = "0"] = metrosCubicos.toString().split("e");
  const [entera, decimales = ""] = coeficiente.split(".");
  const producto = BigInt(entera + decimales) * BigInt(precio);
  const exponente = Number(potencia) - decimales.length;
  let redondeado: bigint;

  if (exponente >= 0) {
    redondeado = producto * 10n ** BigInt(exponente);
  } else {
    const divisor = 10n ** BigInt(-exponente);
    redondeado = producto / divisor;

    if ((producto % divisor) * 2n >= divisor) {
      redondeado += 1n;
    }
  }

  if (redondeado > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("El importe excede el rango numérico seguro de céntimos.");
  }

  return Number(redondeado);
}
