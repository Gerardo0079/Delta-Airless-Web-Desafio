import { obtenerSesionActual } from "../services/auth.service.js";
import { obtenerProductos } from "../services/productos.service.js";
import { 
  crearSolicitud, 
  obtenerSolicitudesCliente, 
  obtenerTodasSolicitudes, 
  actualizarEstadoSolicitud, 
  cancelarSolicitudCliente 
} from "../services/solicitudes.service.js";
import { escaparHTML, fechaHoyLocal, mostrarMensaje, normalizar } from "../utils/dom.js";

const $formulario = document.getElementById("form-solicitud"); // Asegúrate de asignar este ID en contacto.html
const $estado = document.getElementById("mensaje-estado");
const $selectModelo = document.getElementById("modelo");

// 1. Llenar el <select> con las máquinas del catálogo y leer el parámetro ?modelo= de la URL
async function inicializarSelectorModelos() {
  if (!$selectModelo) return;
  try {
    const productos = await obtenerProductos();
    const activas = productos.filter(p => p.activo !== false);
    
    $selectModelo.innerHTML = '<option value="">Selecciona un modelo</option>' +
      activas.map(p => `<option value="${escaparHTML(p.id)}">${escaparHTML(p.nombre)}</option>`).join("") +
      '<option value="">Aún no lo sé</option>';

    // Leer parámetro ?modelo= de la URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const modeloParam = urlParams.get("modelo");
    if (modeloParam) {
      $selectModelo.value = modeloParam;
    }
  } catch (err) {
    console.error("Error cargando modelos en el selector:", err);
  }
}

// 2. Validaciones estrictas del formulario de solicitud
function validarSolicitud(datos) {
  const errores = [];
  if (!datos.tipoSolicitud) errores.push("Selecciona el tipo de solicitud.");
  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > 50)
    errores.push("La cantidad debe ser un entero entre 1 y 50.");
  if (datos.fechaPreferida && datos.fechaPreferida < fechaHoyLocal())
    errores.push("La fecha preferida no puede ser anterior a hoy.");
  if (datos.mensaje.length < 10 || datos.mensaje.length > 500)
    errores.push("El mensaje debe tener entre 10 y 500 caracteres.");
  return errores;
}

// 3. Cálculo de KPIs para el Administrador (Procesamiento de datos #2)
function calcularKPIs(solicitudes) {
  return {
    total: solicitudes.length,
    cotizaciones: solicitudes.filter(s => s.tipoSolicitud === "cotizacion").length,
    servicios: solicitudes.filter(s => ["mantenimiento", "reparacion"].includes(s.tipoSolicitud)).length,
    pendientes: solicitudes.filter(s => s.estado === "Pendiente").length,
    unidades: solicitudes.reduce((suma, s) => suma + s.cantidad, 0)
  };
}