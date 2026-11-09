// js/services/auth.service.js
import { auth, db } from "../config/firebase.js";

/* ==========================================================================
   MODO SIMULACIÓN (FASE INICIAL)
   Cambia esta constante en tu computadora para probar las vistas:
   - "admin"   -> Prueba crear/editar máquinas y responder solicitudes
   - "cliente" -> Prueba enviar solicitudes en contacto y ver tu historial
   - null      -> Prueba cómo se ve la página para un visitante sin sesión
   ========================================================================== */
const ROL_SIMULADO = "admin";

const USUARIOS_PRUEBA = {
  admin: {
    uid: "uid_admin_delta_01",
    nombre: "Administrador Grupo Partes",
    empresa: "Grupo Partes El Salvador",
    correo: "parteselsalvador@yahoo.com",
    telefono: "2319-4425",
    rol: "admin"
  },
  cliente: {
    uid: "uid_cliente_delta_02",
    nombre: "Carlos Martínez",
    empresa: "Constructora del Pacífico",
    correo: "carlos@ejemplo.com",
    telefono: "7000-5512",
    rol: "cliente"
  }
};

/**
 * Devuelve la sesión activa del usuario (o null si no ha iniciado sesión).
 * Es asíncrona para mantener compatibilidad total cuando se conecte Firestore.
 */
export async function obtenerSesionActual() {
  if (!ROL_SIMULADO) {
    return null;
  }
  return USUARIOS_PRUEBA[ROL_SIMULADO];
}

/**
 * Ejecuta un callback cada vez que cambia el estado de la sesión.
 * Útil para actualizar el menú de navegación y mostrar/ocultar botones por rol.
 */
export function escucharCambiosSesion(callback) {
  obtenerSesionActual().then((usuario) => {
    callback(usuario);
  });
}

/**
 * Verifica rápidamente si hay un administrador activo.
 */
export async function esUsuarioAdmin() {
  const usuario = await obtenerSesionActual();
  return usuario !== null && usuario.rol === "admin";
}