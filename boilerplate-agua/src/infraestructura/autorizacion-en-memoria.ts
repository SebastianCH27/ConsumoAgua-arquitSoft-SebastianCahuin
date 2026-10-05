import type { AutorizacionConsulta } from "../aplicacion/contratos-consulta.js";

export interface PermisoSuministro {
  readonly usuarioId: string;
  readonly suministroId: string;
}

// Adaptador de permisos ficticios. No acredita identidades reales.
export class AutorizacionEnMemoria implements AutorizacionConsulta {
  private readonly permisos = new Map<string, Set<string>>();

  constructor(accesos: readonly PermisoSuministro[]) {
    for (const acceso of accesos) {
      for (const valor of [acceso.usuarioId, acceso.suministroId]) {
        if (typeof valor !== "string" || valor.trim().length === 0) {
          throw new Error("Los permisos requieren usuario y suministro válidos.");
        }
      }
      const suministros = this.permisos.get(acceso.usuarioId) ?? new Set<string>();
      suministros.add(acceso.suministroId);
      this.permisos.set(acceso.usuarioId, suministros);
    }
  }

  async puedeConsultar(usuarioId: string, suministroId: string): Promise<boolean> {
    return this.permisos.get(usuarioId)?.has(suministroId) ?? false;
  }
}
