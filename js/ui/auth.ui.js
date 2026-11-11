// Eventos, validaciones y mensajes de login.html (inicio de sesión y registro).
import {
  registrarUsuario,
  iniciarSesion,
  obtenerSesionActual,
} from "../services/auth.service.js";
import { mostrarMensaje } from "../utils/dom.js";

/* ---------- Referencias al DOM ---------- */
const $tabLogin = document.getElementById("tab-login");
const $tabRegistro = document.getElementById("tab-registro");
const $formLogin = document.getElementById("form-login");
const $formRegistro = document.getElementById("form-registro");
const $msgLogin = document.getElementById("mensaje-login");
const $msgRegistro = document.getElementById("mensaje-registro");

/* ---------- Mensajes de error de Firebase en español ---------- */
const MENSAJES_AUTH = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/network-request-failed":
    "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "perfil/no-guardado":
    "Tu cuenta se creó, pero no se pudo guardar tu perfil. Inicia sesión e inténtalo de nuevo.",
};

function traducirError(error) {
  return (
    MENSAJES_AUTH[error?.code] ??
    "Ocurrió un error inesperado. Intenta de nuevo."
  );
}

/* ---------- A dónde volver después de entrar ---------- */
// Solo se aceptan nombres de página propios (ej. contacto.html): evita redirecciones a sitios externos.
function destinoSeguro() {
  const volver =
    new URLSearchParams(window.location.search).get("volver") ?? "";
  const valido = /^[a-z0-9_-]+\.html$/i.test(volver) && volver !== "login.html";
  return valido ? volver : "productos.html";
}

/* ---------- Pestañas Iniciar sesión / Crear cuenta ---------- */
function mostrarFormulario(cual) {
  const esLogin = cual === "login";
  $formLogin.hidden = !esLogin;
  $formRegistro.hidden = esLogin;
  $tabLogin.className = esLogin ? "btn-primario" : "btn-secundario";
  $tabRegistro.className = esLogin ? "btn-secundario" : "btn-primario";
  $tabLogin.setAttribute("aria-pressed", String(esLogin));
  $tabRegistro.setAttribute("aria-pressed", String(!esLogin));
}
$tabLogin.addEventListener("click", () => mostrarFormulario("login"));
$tabRegistro.addEventListener("click", () => mostrarFormulario("registro"));
mostrarFormulario(window.location.hash === "#registro" ? "registro" : "login");

/* ---------- Estado de carga en el botón ---------- */
async function conCarga(boton, textoCarga, tarea) {
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoCarga;
  try {
    return await tarea();
  } finally {
    boton.disabled = false; // siempre se reactiva, haya éxito o error
    boton.textContent = textoOriginal;
  }
}

/* ---------- INICIAR SESIÓN ---------- */
$formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // sin esto la página se recarga
  const $correo = document.getElementById("login-correo");
  const correo = $correo.value.trim();
  const password = document.getElementById("login-password").value;

  const errores = [];
  if (!correo || !$correo.checkValidity())
    errores.push("Escribe un correo electrónico válido.");
  if (!password) errores.push("Escribe tu contraseña.");
  if (errores.length) {
    mostrarMensaje($msgLogin, errores.join(" "), "error");
    return;
  }

  mostrarMensaje($msgLogin, "", "info");
  const boton = $formLogin.querySelector('button[type="submit"]');
  try {
    await conCarga(boton, "Ingresando...", () =>
      iniciarSesion(correo, password),
    );
    mostrarMensaje($msgLogin, "Sesión iniciada. Redirigiendo...", "exito");
    window.location.href = destinoSeguro();
  } catch (error) {
    console.error(error);
    mostrarMensaje($msgLogin, traducirError(error), "error");
  }
});

/* ---------- CREAR CUENTA ---------- */
$formRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nombre = document.getElementById("reg-nombre").value.trim();
  const empresa = document.getElementById("reg-empresa").value.trim();
  const $correo = document.getElementById("reg-correo");
  const correo = $correo.value.trim();
  const telefono = document.getElementById("reg-telefono").value.trim();
  const password = document.getElementById("reg-password").value;
  const password2 = document.getElementById("reg-password2").value;

  const errores = [];
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' .-]{3,60}$/.test(nombre))
    errores.push("El nombre debe tener entre 3 y 60 letras.");
  if (!correo || !$correo.checkValidity())
    errores.push("Escribe un correo electrónico válido.");
  if (!/^[0-9+ \-]{8,15}$/.test(telefono))
    errores.push(
      "El teléfono debe tener entre 8 y 15 caracteres (números, espacios, + o guion).",
    );
  if (password.length < 6)
    errores.push("La contraseña debe tener al menos 6 caracteres.");
  if (password !== password2) errores.push("Las contraseñas no coinciden.");
  if (errores.length) {
    mostrarMensaje($msgRegistro, errores.join(" "), "error");
    return;
  }

  mostrarMensaje($msgRegistro, "", "info");
  const boton = $formRegistro.querySelector('button[type="submit"]');
  try {
    await conCarga(boton, "Creando cuenta...", () =>
      registrarUsuario({ nombre, empresa, telefono, correo, password }),
    );
    mostrarMensaje($msgRegistro, "¡Cuenta creada! Redirigiendo...", "exito");
    window.location.href = destinoSeguro();
  } catch (error) {
    console.error(error);
    mostrarMensaje($msgRegistro, traducirError(error), "error");
  }
});

/* ---------- Si ya hay sesión, no tiene sentido mostrar el login ---------- */
(async () => {
  const sesion = await obtenerSesionActual();
  if (sesion) {
    mostrarMensaje(
      $msgLogin,
      `Ya iniciaste sesión como ${sesion.nombre}. Redirigiendo...`,
      "info",
    );
    setTimeout(() => {
      window.location.href = destinoSeguro();
    }, 1200);
  }
})();
