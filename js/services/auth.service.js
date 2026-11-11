// Autenticación REAL con Firebase Auth + perfil/rol en Firestore (colección 'usuarios').
import { auth, db } from "../config/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Lee el perfil (nombre, rol, etc.) guardado en usuarios/{uid}
async function leerPerfil(user) {
  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) return { uid: user.uid, ...snap.data() };
  } catch (error) {
    console.error("No se pudo leer el perfil:", error);
  }
  // Sin perfil en Firestore: se trata como cliente (NUNCA como admin)
  return {
    uid: user.uid, nombre: user.email, empresa: "", telefono: "",
    correo: user.email, rol: "cliente"
  };
}

export async function registrarUsuario({ nombre, empresa, telefono, correo, password }) {
  const credencial = await createUserWithEmailAndPassword(auth, correo, password);
  const perfil = {
    nombre,
    empresa: empresa || "",
    telefono,
    correo,
    rol: "cliente",                       // FIJO: nadie se registra como admin
    fechaRegistro: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, "usuarios", credencial.user.uid), perfil);
  } catch (error) {
    error.code = "perfil/no-guardado";    // la cuenta existe pero el perfil no se guardó
    throw error;
  }
  return { uid: credencial.user.uid, ...perfil };
}

export async function iniciarSesion(correo, password) {
  await signInWithEmailAndPassword(auth, correo, password);
}

export async function cerrarSesion() {
  await signOut(auth);
}

// Devuelve el perfil completo del usuario o null si no hay sesión.
// authStateReady() espera a que Firebase restaure la sesión guardada;
// sin esto, currentUser sale null al cargar la página aunque el usuario esté logueado.
export async function obtenerSesionActual() {
  await auth.authStateReady();
  return auth.currentUser ? leerPerfil(auth.currentUser) : null;
}

// callback(usuario | null) se ejecuta al cargar y cada vez que cambia la sesión
export function escucharCambiosSesion(callback) {
  return onAuthStateChanged(auth, async (user) => {
    callback(user ? await leerPerfil(user) : null);
  });
}

export async function esUsuarioAdmin() {
  const sesion = await obtenerSesionActual();
  return sesion?.rol === "admin";
}
