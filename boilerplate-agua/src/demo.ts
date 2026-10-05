import { ConsultarResumenConsumo } from "./aplicacion/consultar-resumen-consumo.js";
import { AutorizacionEnMemoria } from "./infraestructura/autorizacion-en-memoria.js";
import { RepositorioAguaEnMemoria } from "./infraestructura/repositorio-agua-en-memoria.js";
import { crearDatosSimulados, PERIODO_DEMO } from "./infraestructura/fuente-agua-simulada.js";
import { formatearResumen } from "./presentacion/formatear-resumen.js";

// Punto de composición: conecta los contratos con sus adaptadores.
const datos = crearDatosSimulados();
const repositorio = new RepositorioAguaEnMemoria(datos);
const permisos = new AutorizacionEnMemoria(datos.map(({ suministroId }) => ({
  usuarioId: "USU-DEMO", suministroId,
})));
const consultar = new ConsultarResumenConsumo(permisos, repositorio);

console.log("DEMOSTRACIÓN DEL SISTEMA DE CONSUMO DE AGUA");
console.log("Datos, usuarios, tarifas y límites ficticios. Fechas en UTC.");
console.log("Almacenamiento en memoria: los datos se reinician en cada ejecución.");

const escenarios = [
  { nombre: "Consumo normal", usuarioId: "USU-DEMO", suministroId: "SUM-NORMAL" },
  { nombre: "Consumo elevado", usuarioId: "USU-DEMO", suministroId: "SUM-ELEVADO" },
  { nombre: "Datos incompletos", usuarioId: "USU-DEMO", suministroId: "SUM-INCOMPLETO" },
  { nombre: "Consulta sin permiso", usuarioId: "USU-SIN-ACCESO", suministroId: "SUM-ELEVADO" },
];

for (const escenario of escenarios) {
  const resultado = await consultar.ejecutar(
    { usuarioId: escenario.usuarioId },
    { suministroId: escenario.suministroId, periodo: PERIODO_DEMO },
  );
  console.log(`\n=== ${escenario.nombre} ===`);
  console.log(formatearResumen(resultado));
  if (resultado.estado === "error") process.exitCode = 1;
}
