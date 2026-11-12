
import { auth, db } from "../config/firebase.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, query, where
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const coleccion = collection(db, "solicitudes");
const porFechaDesc = (a, b) => String(b.fechaCreacion ?? "").localeCompare(String(a.fechaCreacion ?? ""));

export async function crearSolicitud(datos) {
  await auth.authStateReady();
  if (!auth.currentUser) {
    const error = new Error("Se necesita una sesión activa para enviar solicitudes.");
    error.code = "solicitud/sin-sesion";
    throw error;
  }
  const solicitud = {
    uidCliente: auth.currentUser.uid,      // Se toma del usuario autenticado, nunca del formulario
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
  await auth.authStateReady();
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    const error = new Error("Solo puedes consultar tus propias solicitudes.");
    error.code = "permission-denied";
    throw error;
  }
  const snap = await getDocs(query(coleccion, where("uidCliente", "==", uid)));
  // Se ordena en JavaScript para evitar requerir índices compuestos en Firebase
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porFechaDesc);
}

export async function obtenerTodasSolicitudes() {
  // Solo permitido para administradores, mediante reglas de Firestore.
  const snap = await getDocs(coleccion);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porFechaDesc);
}

export async function actualizarEstadoSolicitud(id, estado, respuestaAdmin) {
  const estadosValidos = ["Pendiente", "En revisión", "Aprobada", "Finalizada", "Cancelada"];
  const respuesta = String(respuestaAdmin ?? "").trim();
  if (!estadosValidos.includes(estado)) throw new Error("Estado inválido.");
  if (["Aprobada", "Finalizada"].includes(estado) && !respuesta) {
    throw new Error("La aprobación o finalización requiere respuesta técnica.");
  }
  await updateDoc(doc(db, "solicitudes", id), { estado, respuestaAdmin: respuesta });
}

export async function cancelarSolicitudCliente(id) {
  // Solo cambia el estado, como exigen las reglas de seguridad.
  await updateDoc(doc(db, "solicitudes", id), { estado: "Cancelada" });
}
