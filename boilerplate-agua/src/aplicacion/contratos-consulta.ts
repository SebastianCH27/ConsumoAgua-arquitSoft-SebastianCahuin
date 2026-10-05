import type { LecturaAgua } from "../dominio/lectura-agua.js";
import type { PeriodoConsumo } from "../dominio/periodo-consumo.js";
import type { TarifaConsumo } from "../dominio/tarifa-consumo.js";
import type { CriterioConsumoElevado } from "../dominio/alerta-consumo.js";

export interface ContextoConsulta {
  // La identidad debe proceder del contexto acreditado por la entrada.
  // En la demostración se utilizarán usuarios ficticios.
  readonly usuarioId: string;
}

export interface SolicitudResumenConsumo {
  readonly suministroId: string;
  readonly periodo: PeriodoConsumo;
}

export interface AutorizacionConsulta {
  puedeConsultar(usuarioId: string, suministroId: string): Promise<boolean>;
}

export interface DatosConsultaAgua {
  readonly suministroId: string;
  readonly versionDatos: string;
  readonly tipoMedicion: "acumulada" | "intervalo";
  readonly lecturas: readonly LecturaAgua[];
  readonly tarifa: TarifaConsumo | null;
  readonly criterioConsumoElevado: CriterioConsumoElevado | null;
}

export interface RepositorioConsultaAgua {
  // Devuelve información almacenada de una misma versión consistente.
  // Selecciona las configuraciones correspondientes al periodo consultado.
  // null indica que el suministro no está disponible en el repositorio.
  obtenerDatos(
    suministroId: string,
    periodo: PeriodoConsumo,
  ): Promise<DatosConsultaAgua | null>;
}
