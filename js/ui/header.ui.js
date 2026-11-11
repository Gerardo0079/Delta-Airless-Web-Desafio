// Pinta en el menú (<li id="nav-sesion">) el estado de la sesión en todas las páginas.
import { escucharCambiosSesion, cerrarSesion } from "../services/auth.service.js";

const $nav = document.getElementById("nav-sesion");

function pintarVisitante() {
  const enlace = document.createElement("a");
  enlace.href = "login.html";
  enlace.textContent = "Iniciar sesión";
  if (window.location.pathname.endsWith("login.html")) {
    enlace.className = "activo";
    enlace.setAttribute("aria-current", "page");
  }
  $nav.replaceChildren(enlace);
}

function pintarUsuario(usuario) {
  const contenedor = document.createElement("div");
  contenedor.className = "sesion-usuario";

  const nombre = document.createElement("span");
  nombre.className = "sesion-nombre";
  nombre.textContent = usuario.nombre;          // textContent: nunca innerHTML con datos de usuario

  const etiqueta = document.createElement("span");
  const esAdmin = usuario.rol === "admin";
  etiqueta.className = `badge ${esAdmin ? "badge-rol-admin" : "badge-rol-cliente"}`;
  etiqueta.textContent = esAdmin ? "Admin" : "Cliente";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn-cerrar-sesion";
  boton.textContent = "Cerrar sesión";
  boton.addEventListener("click", async () => {
    boton.disabled = true;
    boton.textContent = "Cerrando...";
    try {
      await cerrarSesion();
      window.location.reload();                 // las páginas vuelven a leer la sesión (ya vacía)
    } catch (error) {
      console.error(error);
      boton.disabled = false;
      boton.textContent = "Cerrar sesión";
    }
  });

  contenedor.append(nombre, etiqueta, boton);
  $nav.replaceChildren(contenedor);
}

if ($nav) {
  escucharCambiosSesion((usuario) => {
    if (usuario) pintarUsuario(usuario);
    else pintarVisitante();
  });
}
