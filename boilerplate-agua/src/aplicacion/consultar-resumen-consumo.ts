import type {
  AutorizacionConsulta, ContextoConsulta, RepositorioConsultaAgua,
  SolicitudResumenConsumo,
} from "./contratos-consulta.js";
import { crearPeriodo } from "../dominio/periodo-consumo.js";
import type { PeriodoConsumo } from "../dominio/periodo-consumo.js";
import { calcularConsumoPeriodoIntervalos } from "../dominio/consumo-periodo-intervalos.js";
import type { ResultadoConsumoPeriodoIntervalos } from "../dominio/consumo-periodo-intervalos.js";
import { calcularConsumoPeriodoAcumulado } from "../dominio/consumo-periodo-acumulado.js";
import type { ResultadoConsumoPeriodoAcumulado } from "../dominio/consumo-periodo-acumulado.js";
import { estimarCostoConsumo } from "../dominio/costo-consumo.js";
import type { ResultadoCostoConsumo } from "../dominio/costo-consumo.js";
import { evaluarConsumoElevado } from "../dominio/alerta-consumo.js";
import type { ResultadoEvaluacionConsumo } from "../dominio/alerta-consumo.js";

type EstadoFallo = "solicitud_invalida" | "no_autorizado" | "no_disponible" | "error";

export type ResultadoConsultaResumen =
  | {
      readonly estado: "consultado";
      readonly suministroId: string;
      readonly periodo: PeriodoConsumo;
      readonly versionDatos: string;
      readonly consumo: ResultadoConsumoPeriodoIntervalos | ResultadoConsumoPeriodoAcumulado;
      readonly costo: ResultadoCostoConsumo;
      readonly consumoElevado: ResultadoEvaluacionConsumo;
    }
  | { readonly estado: EstadoFallo; readonly motivo: string };

export class ConsultarResumenConsumo {
  constructor(
    private readonly autorizacion: AutorizacionConsulta,
    private readonly repositorio: RepositorioConsultaAgua,
  ) {}

  async ejecutar(
    contexto: ContextoConsulta,
    solicitud: SolicitudResumenConsumo,
  ): Promise<ResultadoConsultaResumen> {
    let usuarioId: string;
    let suministroId: string;
    let periodo: PeriodoConsumo;

    try {
      usuarioId = contexto.usuarioId;
      suministroId = solicitud.suministroId;
      validarIdentificador(usuarioId, "usuario");
      validarIdentificador(suministroId, "suministro");
      periodo = crearPeriodo(solicitud.periodo);
    } catch (error) {
      return fallo(
        "solicitud_invalida",
        error instanceof Error ? error.message : "La solicitud no es válida.",
      );
    }

    try {
      const permitido = await this.autorizacion.puedeConsultar(usuarioId, suministroId);

      if (permitido !== true) {
        return fallo("no_autorizado", "No tienes permiso para consultar este suministro.");
      }

      const datos = await this.repositorio.obtenerDatos(suministroId, periodo);

      if (datos === null) {
        return fallo("no_disponible", "No hay información disponible para este suministro.");
      }

      if (
        datos.suministroId !== suministroId ||
        typeof datos.versionDatos !== "string" || datos.versionDatos.trim().length === 0 ||
        (datos.tipoMedicion !== "intervalo" && datos.tipoMedicion !== "acumulada") ||
        !Array.isArray(datos.lecturas) ||
        Array.from(datos.lecturas).some((lectura) => lectura.suministroId !== suministroId)
      ) {
        return fallo("error", "No se pudo verificar la información del suministro solicitado.");
      }

      const consumo = datos.tipoMedicion === "intervalo"
        ? calcularConsumoPeriodoIntervalos(periodo, datos.lecturas)
        : calcularConsumoPeriodoAcumulado(periodo, datos.lecturas);

      return Object.freeze({
        estado: "consultado",
        suministroId,
        periodo,
        versionDatos: datos.versionDatos,
        consumo,
        costo: estimarCostoConsumo(consumo, datos.tarifa),
        consumoElevado: evaluarConsumoElevado(consumo, datos.criterioConsumoElevado),
      });
    } catch {
      return fallo("error", "No fue posible consultar el resumen del suministro.");
    }
  }
}

function validarIdentificador(valor: unknown, campo: string): void {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new Error(`Se requiere un identificador de ${campo} válido.`);
  }
}

function fallo(estado: EstadoFallo, motivo: string): ResultadoConsultaResumen {
  return { estado, motivo };
}
