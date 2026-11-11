import { db } from "../config/firebase.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, query, where
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const coleccion = collection(db, "solicitudes");
const porFechaDesc = (a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion);

export async function crearSolicitud(datos) {
  const solicitud = {
    uidCliente: datos.uidCliente,          // Siempre de la sesión activa
    nombreCliente: datos.nombreCliente,
    empresa: datos.empresa || "",
    correo: datos.correo,
    telefono: datos.telefono,
    tipoSolicitud: datos.tipoSolicitud,    // cotizacion | mantenimiento | reparacion | repuestos
    productoId: datos.productoId || "",
    modeloNombre: datos.modeloNombre || "Aún no lo sé",   // Copia de seguridad si borran la máquina
    cantidad: datos.cantidad,              // Número entero 1-50
    fechaPreferida: datos.fechaPreferida || "",
    mensaje: datos.mensaje,
    estado: "Pendiente",                   // Requisito estricto de las reglas de seguridad
    respuestaAdmin: "",                    // Requisito estricto: vacío al crear
    fechaCreacion: new Date().toISOString()
  };
  const ref = await addDoc(coleccion, solicitud);
  return ref.id;
}

export async function obtenerSolicitudesCliente(uid) {
  const snap = await getDocs(query(coleccion, where("uidCliente", "==", uid)));
  // Se ordena en JavaScript para evitar requerir índices compuestos en Firebase
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porFechaDesc);
}

export async function obtenerTodasSolicitudes() {            // Solo permitido para administradores (vía reglas)
  const snap = await getDocs(coleccion);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porFechaDesc);
}

export async function actualizarEstadoSolicitud(id, estado, respuestaAdmin) {
  await updateDoc(doc(db, "solicitudes", id), { estado, respuestaAdmin });
}

export async function cancelarSolicitudCliente(id) {
  // Envía exclusivamente el cambio de estado para cumplir con las reglas de seguridad (.hasOnly(['estado']))
  await updateDoc(doc(db, "solicitudes", id), { estado: "Cancelada" });
}