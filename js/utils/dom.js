// Evita que texto escrito por usuarios se interprete como HTML 
export function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// Muestra un mensaje en un contenedor (usar role="status" o role="alert" en el HTML)
// tipo: "info" | "exito" | "error". Si texto es "" el contenedor se oculta.
export function mostrarMensaje(contenedor, texto, tipo = "info") {
  contenedor.textContent = texto;
  contenedor.className = `mensaje mensaje-${tipo}`;
  contenedor.hidden = !texto;
}

// Fecha de hoy en formato AAAA-MM-DD usando la hora LOCAL (no UTC)
export function fechaHoyLocal() {
  const f = new Date();
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const dia = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${mes}-${dia}`;
}

// Minúsculas y sin tildes, para búsquedas ("Epóxica" == "epoxica")
export function normalizar(texto) {
  return String(texto ?? "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
