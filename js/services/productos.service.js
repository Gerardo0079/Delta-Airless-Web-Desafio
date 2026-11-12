// js/services/productos.service.js
// CRUD de la colección 'productos' (Integrante 2).
// Capa de DATOS: solo habla con Firestore. No toca el DOM; los errores se propagan
// (throw) hacia js/ui/ para que allí se muestren al usuario.
import { db } from "../config/firebase.js";
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const NOMBRE_COLECCION = "productos";
const coleccion = collection(db, NOMBRE_COLECCION);

// El id del documento NUNCA se guarda como campo dentro del documento:
// se quita por si la interfaz envía un objeto que ya lo trae (p. ej. uno leído con obtenerProductos).
function sinId(datos) {
  const { id, ...campos } = datos;
  return campos;
}

// READ (todos). Contrato (Sección 2.4): Promise<Array<{id, ...campos}>>
// También lo usa solicitudes.ui.js para llenar el <select> de modelos.
export async function obtenerProductos() {
  const snap = await getDocs(coleccion);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// READ (uno). Devuelve {id, ...campos} o null si no existe.
export async function obtenerProductoPorId(id) {
  const snap = await getDoc(doc(db, NOMBRE_COLECCION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// CREATE. Firestore genera el id. Devuelve el id nuevo.
// Solo el administrador puede (reglas de Firestore).
export async function crearProducto(datos) {
  const ref = await addDoc(coleccion, sinId(datos));
  return ref.id;
}

// UPDATE. Reemplaza los campos enviados; los demás se conservan.
export async function actualizarProducto(id, datos) {
  await updateDoc(doc(db, NOMBRE_COLECCION, id), sinId(datos));
}

// DELETE.
export async function eliminarProducto(id) {
  await deleteDoc(doc(db, NOMBRE_COLECCION, id));
}
