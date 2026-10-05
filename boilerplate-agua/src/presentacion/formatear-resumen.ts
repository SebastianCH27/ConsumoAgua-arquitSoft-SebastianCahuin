import type { ResultadoConsultaResumen } from "../aplicacion/consultar-resumen-consumo.js";

// Presenta los resultados recibidos; no calcula reglas de negocio.
export function formatearResumen(resultado: ResultadoConsultaResumen): string {
  if (resultado.estado !== "consultado") {
    return `Estado de consulta: ${resultado.estado}\nMotivo: ${resultado.motivo}`;
  }

  const lineas = [
    `Estado de consulta: ${resultado.estado}`,
    `Suministro: ${resultado.suministroId}`,
    `Periodo UTC: ${resultado.periodo.desde} → ${resultado.periodo.hasta}`,
    `Versión de datos: ${resultado.versionDatos}`,
  ];
  const consumo = resultado.consumo;

  if (consumo.estado === "no_calculable") {
    lineas.push(`Consumo no calculable: ${consumo.motivo}`);
  } else {
    lineas.push(
      `Consumo observado: ${consumo.consumoLitros} L (${consumo.consumoMetrosCubicos} m3)`,
      `Cobertura: ${consumo.estado === "calculado" ? "completa" : "incompleta"}`,
      `Lecturas utilizadas: ${consumo.lecturasUsadas.join(", ")}`,
    );
    if ("lecturasRevisadas" in consumo) {
      lineas.push(`Lecturas revisadas: ${consumo.lecturasRevisadas.join(", ")}`);
    }
    for (const tramo of consumo.tramosSinDatos) {
      lineas.push(`Tramo sin datos: ${tramo.desde} → ${tramo.hasta}`);
    }
  }

  const costo = resultado.costo;
  if (costo.estado === "no_estimable") {
    lineas.push(`Costo no estimable: ${costo.motivo}`);
  } else {
    const centimos = BigInt(costo.importeCentimos);
    const importe = `${centimos / 100n}.${(centimos % 100n).toString().padStart(2, "0")}`;
    lineas.push(
      `Costo estimado: S/ ${importe} (${costo.estado})`,
      `Tarifa: ${costo.tarifa.id}, versión ${costo.tarifa.version}`,
      `Conceptos incluidos: ${costo.conceptosIncluidos.join(", ")}`,
    );
  }
  lineas.push(
    `Consumo elevado: ${resultado.consumoElevado.estado}`,
    `Motivo: ${resultado.consumoElevado.motivo}`,
  );
  return lineas.join("\n");
}
