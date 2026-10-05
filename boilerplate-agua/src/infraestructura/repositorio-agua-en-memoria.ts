import type {
  DatosConsultaAgua, RepositorioConsultaAgua,
} from "../aplicacion/contratos-consulta.js";
import { crearLectura } from "../dominio/lectura-agua.js";
import { crearPeriodo } from "../dominio/periodo-consumo.js";
import type { PeriodoConsumo } from "../dominio/periodo-consumo.js";
import { crearTarifa } from "../dominio/tarifa-consumo.js";
import { crearCriterioConsumoElevado } from "../dominio/alerta-consumo.js";

// Conserva una instantánea validada por suministro; no persiste en disco.
export class RepositorioAguaEnMemoria implements RepositorioConsultaAgua {
  private readonly datos = new Map<string, DatosConsultaAgua>();

  constructor(informacion: readonly DatosConsultaAgua[]) {
    for (const entrada of informacion) {
      if (
        typeof entrada.suministroId !== "string" || !entrada.suministroId.trim() ||
        typeof entrada.versionDatos !== "string" || !entrada.versionDatos.trim() ||
        (entrada.tipoMedicion !== "intervalo" && entrada.tipoMedicion !== "acumulada") ||
        this.datos.has(entrada.suministroId)
      ) {
        throw new Error("La instantánea requiere suministro, versión y tipo válidos, sin suministros repetidos.");
      }

      const lecturas = Array.from(entrada.lecturas, crearLectura);
      const tarifa = entrada.tarifa === null ? null : crearTarifa(entrada.tarifa);
      const criterio = entrada.criterioConsumoElevado === null
        ? null : crearCriterioConsumoElevado(entrada.criterioConsumoElevado);

      if (
        lecturas.some((lectura) => lectura.suministroId !== entrada.suministroId ||
          lectura.tipo !== entrada.tipoMedicion) ||
        (tarifa !== null && tarifa.suministroId !== entrada.suministroId) ||
        (criterio !== null && criterio.suministroId !== entrada.suministroId)
      ) {
        throw new Error("Las lecturas y configuraciones deben corresponder al suministro de la instantánea.");
      }

      this.datos.set(entrada.suministroId, Object.freeze({
        suministroId: entrada.suministroId,
        versionDatos: entrada.versionDatos,
        tipoMedicion: entrada.tipoMedicion,
        lecturas: Object.freeze(lecturas),
        tarifa,
        criterioConsumoElevado: criterio,
      }));
    }
  }

  async obtenerDatos(
    suministroId: string, solicitado: PeriodoConsumo,
  ): Promise<DatosConsultaAgua | null> {
    const periodo = crearPeriodo(solicitado);
    const guardado = this.datos.get(suministroId);
    if (guardado === undefined) return null;

    const desde = Date.parse(periodo.desde);
    const hasta = Date.parse(periodo.hasta);
    const lecturas = guardado.lecturas.filter((lectura) => {
      const fin = Date.parse(lectura.fechaMedicion);
      return lectura.tipo === "acumulada"
        ? fin >= desde && fin <= hasta
        : fin > desde && Date.parse(lectura.fechaInicioIntervalo!) < hasta;
    });

    // Un intervalo que cruza un límite se conserva para que el dominio
    // informe que no puede dividir su cantidad sin datos adicionales.
    const tarifa = guardado.tarifa;
    const tarifaAplicable = tarifa !== null &&
      Date.parse(tarifa.vigenteDesde) < hasta &&
      (tarifa.vigenteHasta === undefined || Date.parse(tarifa.vigenteHasta) > desde);
    const criterio = guardado.criterioConsumoElevado;
    const criterioAplicable = criterio !== null &&
      criterio.periodo.desde === periodo.desde && criterio.periodo.hasta === periodo.hasta;

    return Object.freeze({
      ...guardado,
      lecturas: Object.freeze(lecturas),
      tarifa: tarifaAplicable ? tarifa : null,
      criterioConsumoElevado: criterioAplicable ? criterio : null,
    });
  }
}
