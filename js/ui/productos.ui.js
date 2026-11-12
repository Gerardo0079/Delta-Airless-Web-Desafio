// js/ui/productos.ui.js
// Catálogo dinámico de productos.html (Integrante 2).
// Capa de INTERFAZ: toca el DOM y llama a los servicios. No habla directo con Firestore.
//  - Procesamiento de datos #1: buscar + filtrar + ordenar (en memoria, sin nuevas consultas).
//  - CRUD completo para el administrador (crear, editar, eliminar) con validaciones.
import {
  obtenerProductos, crearProducto, actualizarProducto, eliminarProducto
} from "../services/productos.service.js";
import { obtenerSesionActual } from "../services/auth.service.js";
import { escaparHTML, mostrarMensaje, normalizar } from "../utils/dom.js";

/* ---------- Referencias al DOM ---------- */
const $contenedor = document.getElementById("contenedor-productos");
const $mensaje = document.getElementById("mensaje-catalogo");
const $contador = document.getElementById("contador-resultados");
const $buscar = document.getElementById("buscar-producto");
const $filtroMotor = document.getElementById("filtro-motor");
const $ordenar = document.getElementById("ordenar-producto");
const $btnNuevo = document.getElementById("btn-nuevo-producto");
const $dialogo = document.getElementById("dialogo-producto");
const $form = document.getElementById("form-producto");
const $tituloDialogo = document.getElementById("titulo-dialogo-producto");
const $msgDialogo = document.getElementById("mensaje-dialogo");
const $btnGuardar = document.getElementById("btn-guardar-producto");

/* ---------- Estado en memoria ---------- */
let productos = [];              // copia local de lo que hay en Firestore
let esAdmin = false;
let catalogoListo = false;       // evita filtrar mientras carga o si la carga falló
let productoEditandoId = null;   // null = el formulario está creando una máquina nueva

const IMAGEN_RESPALDO = "img/maquina_Delta_Pintura.jpeg";

/* ====================================================================
   1. CARGA Y RENDERIZADO (estados: cargando, error y vacío)
   ==================================================================== */
function mostrarCarga() {
  $contenedor.innerHTML =
    '<p class="estado-carga" role="status">Cargando catálogo de maquinaria...</p>';
}

async function cargarCatalogo() {
  catalogoListo = false;
  mostrarCarga();
  try {
    productos = await obtenerProductos();
    catalogoListo = true;
    aplicarFiltros();
  } catch (error) {
    console.error(error);
    $contador.textContent = "0";
    $contenedor.innerHTML =
      '<p class="mensaje mensaje-error" role="alert">No se pudo cargar el catálogo. Recarga la página.</p>';
  }
}

// Las rutas de imagen pueden tener espacios ("img/395 XR ULTRA.jpeg"): se codifican con encodeURI.
// decodeURI previo evita doble codificación si el admin pega una ruta que ya trae %20.
function rutaImagen(url) {
  const ruta = String(url ?? "").trim();
  if (!ruta) return IMAGEN_RESPALDO;
  try {
    return encodeURI(decodeURI(ruta));
  } catch {
    return IMAGEN_RESPALDO;
  }
}

// <li> solo si el dato existe (las H20 no tienen producción ni resistencia)
function filaEspecificacion(etiqueta, valor) {
  const texto = String(valor ?? "").trim();
  return texto
    ? `<li><strong>${etiqueta}:</strong> ${escaparHTML(texto)}</li>`
    : "";
}

// Número + unidad. Si el dato falta (null, undefined, "" o no numérico) la fila NO se pinta:
// así nunca llega a pantalla "undefined Litros/Minuto" ni "NaN Kg".
function filaMedida(etiqueta, valor, unidad) {
  const hayDato = valor !== null && valor !== "" && Number.isFinite(Number(valor));
  return hayDato ? filaEspecificacion(etiqueta, `${valor} ${unidad}`) : "";
}

function crearTarjeta(p) {
  // Las H20 tienen motor Honda: en Firestore la potencia viene null (seed) o 0.
  const potencia = Number(p.potenciaW) > 0 ? `${p.potenciaW} W` : "No aplica (motor a gasolina)";
  const esVial = p.linea === "Señalización vial";
  const etiquetaUso = esVial ? "Línea especial" : "Ideal para";
  const uso = String(p.idealPara ?? "").trim();
  const parrafoUso = uso
    ? `<p class="tipos-pintura"><strong>${etiquetaUso}:</strong> ${escaparHTML(uso)}</p>`
    : "";

  const aviso = esAdmin && p.activo === false
    ? '<span class="badge badge-inactivo">Oculta para clientes</span>'
    : "";

  const botonesAdmin = esAdmin
    ? `<div class="grupo-botones">
         <button type="button" class="btn-secundario" data-accion="editar" data-id="${escaparHTML(p.id)}">Editar</button>
         <button type="button" class="btn-secundario btn-peligro" data-accion="eliminar" data-id="${escaparHTML(p.id)}">Eliminar</button>
       </div>`
    : "";

  // TODO dato que viene de Firestore pasa por escaparHTML() (prevención de XSS)
  return `
    <article class="card-producto">
      <div class="imagen-producto">
        <img src="${escaparHTML(rutaImagen(p.imagenUrl))}" alt="${escaparHTML(p.nombre)}" loading="lazy">
      </div>
      <h3>${escaparHTML(p.nombre)} ${aviso}</h3>
      <ul>
        ${filaEspecificacion("Motor", p.motor)}
        <li><strong>Potencia:</strong> ${escaparHTML(potencia)}</li>
        ${filaMedida("Caudal Máx.", p.caudalLMin, "Litros/Minuto")}
        ${filaMedida("Presión Máx.", p.presionMPa, "MPa")}
        ${filaEspecificacion("Boquilla", p.boquilla)}
        ${filaMedida("Peso", p.pesoKg, "Kg")}
        ${filaEspecificacion("Producción", p.produccion)}
        ${filaEspecificacion("Resistencia", p.resistencia)}
        ${filaEspecificacion("Estilo", p.estilo)}
      </ul>
      ${parrafoUso}
      <a class="btn-primario" href="contacto.html?modelo=${encodeURIComponent(p.id)}">Solicitar cotización / servicio</a>
      ${botonesAdmin}
    </article>`;
}

function renderizarProductos(lista) {
  $contador.textContent = lista.length;
  $contenedor.innerHTML = lista.length
    ? lista.map(crearTarjeta).join("")
    : '<p class="estado-vacio">No se encontraron máquinas con esos criterios.</p>';
}

/* ====================================================================
   2. PROCESAMIENTO DE DATOS #1: buscar, filtrar y ordenar (Req. 9)
   ==================================================================== */
const num = (valor) => Number(valor) || 0;     // null / undefined / NaN -> 0

// Las máquinas sin potencia eléctrica (H20) quedan SIEMPRE al final, en ambos sentidos.
const ordenPotencia = (sentido) => (a, b) => {
  const pa = num(a.potenciaW);
  const pb = num(b.potenciaW);
  if (pa === 0 && pb === 0) return 0;
  if (pa === 0) return 1;
  if (pb === 0) return -1;
  return sentido * (pa - pb);
};

// Para agregar un criterio nuevo: una <option> en #ordenar-producto + una entrada aquí.
const criterios = {
  "potencia-desc": ordenPotencia(-1),
  "potencia-asc": ordenPotencia(1),
  "caudal-desc": (a, b) => num(b.caudalLMin) - num(a.caudalLMin),
  "peso-asc": (a, b) => num(a.pesoKg) - num(b.pesoKg)
};

function aplicarFiltros() {
  if (!catalogoListo) return;

  const texto = normalizar($buscar.value.trim());
  const motor = $filtroMotor.value;              // "" = todos
  const orden = $ordenar.value;

  const lista = productos.filter((p) =>
    (esAdmin || p.activo !== false) &&           // el cliente y el visitante no ven las inactivas
    normalizar(`${p.nombre} ${p.linea} ${p.idealPara}`).includes(texto) &&
    (motor === "" || p.motor === motor)
  );

  if (criterios[orden]) lista.sort(criterios[orden]);
  renderizarProductos(lista);
}

/* ====================================================================
   3. EVENTOS DEL CATÁLOGO
   ==================================================================== */
// UN solo listener para todas las tarjetas (delegación de eventos): las tarjetas se
// destruyen y se vuelven a crear en cada filtro, así que listeners individuales se perderían.
$contenedor.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  if (boton.dataset.accion === "editar") abrirFormulario(boton.dataset.id);
  if (boton.dataset.accion === "eliminar") confirmarEliminacion(boton.dataset.id, boton);
});

// Si una imagen no carga (nombre mal escrito, sin internet) se muestra una de respaldo.
// El evento "error" no burbujea, por eso se escucha en fase de captura.
$contenedor.addEventListener("error", (evento) => {
  const img = evento.target;
  if (img.tagName === "IMG" && !img.dataset.respaldo) {
    img.dataset.respaldo = "1";
    img.src = IMAGEN_RESPALDO;
  }
}, true);

[$buscar, $filtroMotor, $ordenar].forEach((control) =>
  control.addEventListener("input", aplicarFiltros));

/* ====================================================================
   4. FORMULARIO CRUD (crear / editar) CON VALIDACIONES (Req. 6 y 10)
   Los atributos name del formulario coinciden con los campos de Firestore.
   ==================================================================== */
const CAMPOS_TEXTO = [
  "nombre", "linea", "motor", "boquilla", "produccion",
  "resistencia", "estilo", "idealPara", "imagenUrl"
];
const CAMPOS_NUMERO = ["potenciaW", "caudalLMin", "presionMPa", "pesoKg"];

// "" -> NaN (campo vacío es inválido). Number("") valdría 0 y pasaría sin querer.
const aNumero = (texto) => (String(texto).trim() === "" ? NaN : Number(texto));

function leerFormulario() {
  const campos = $form.elements;
  const datos = {};
  CAMPOS_TEXTO.forEach((c) => { datos[c] = campos[c].value.trim(); });
  CAMPOS_NUMERO.forEach((c) => { datos[c] = aNumero(campos[c].value); });   // number, no texto
  datos.activo = campos.activo.checked;
  return datos;
}

function validarProducto(d) {
  const errores = [];
  if (d.nombre.length < 3 || d.nombre.length > 80)
    errores.push("El nombre debe tener entre 3 y 80 caracteres.");
  if (!d.linea) errores.push("Indica la línea del producto.");
  if (!d.motor) errores.push("Selecciona el tipo de motor.");
  if (!d.boquilla) errores.push("Indica el rango de boquilla.");
  if (!d.idealPara) errores.push("Indica para qué tipo de trabajo es ideal.");
  if (!Number.isFinite(d.potenciaW) || d.potenciaW < 0)
    errores.push("La potencia debe ser un número mayor o igual a 0 (usa 0 si el motor es a gasolina).");
  if (!Number.isFinite(d.caudalLMin) || d.caudalLMin <= 0)
    errores.push("El caudal debe ser un número mayor que 0.");
  if (!Number.isFinite(d.presionMPa) || d.presionMPa <= 0)
    errores.push("La presión debe ser un número mayor que 0.");
  if (!Number.isFinite(d.pesoKg) || d.pesoKg <= 0)
    errores.push("El peso debe ser un número mayor que 0.");
  // La imagen es opcional, pero si se escribe debe ser una ruta del proyecto o una URL https
  if (d.imagenUrl && !/^(img\/|https:\/\/)/i.test(d.imagenUrl))
    errores.push('La imagen debe ser una ruta que empiece con "img/" o una URL https://.');
  return errores;
}

function abrirFormulario(id = null) {
  const p = id ? productos.find((x) => x.id === id) : null;
  if (id && !p) return;                          // el id no existe en memoria

  productoEditandoId = p ? p.id : null;
  $form.reset();                                 // vuelve a los valores por defecto del HTML
  mostrarMensaje($msgDialogo, "");
  $tituloDialogo.textContent = p ? "Editar máquina" : "Agregar máquina";

  if (p) {
    const campos = $form.elements;
    CAMPOS_TEXTO.forEach((c) => { campos[c].value = p[c] ?? ""; });
    CAMPOS_NUMERO.forEach((c) => { campos[c].value = p[c] ?? ""; });
    campos.potenciaW.value = num(p.potenciaW);   // las H20 traen null: se muestra 0
    campos.activo.checked = p.activo !== false;
  }
  $dialogo.showModal();
  $form.elements.nombre.focus();
}

// Varios errores se muestran como LISTA: nueve frases pegadas en un párrafo son ilegibles en el celular.
// Se arma con textContent (nunca innerHTML), igual que mostrarMensaje() de dom.js.
function mostrarErroresFormulario(errores) {
  mostrarMensaje($msgDialogo, "", "error");      // limpia el contenido y deja las clases de error
  const titulo = document.createElement("strong");
  titulo.textContent = errores.length === 1 ? "Revisa este campo:" : "Revisa estos campos:";
  const lista = document.createElement("ul");
  errores.forEach((texto) => {
    const item = document.createElement("li");
    item.textContent = texto;
    lista.append(item);
  });
  $msgDialogo.append(titulo, lista);
  $msgDialogo.hidden = false;
  $msgDialogo.scrollIntoView({ block: "nearest" });
}

function textoError(error) {
  if (error?.code === "permission-denied")
    return "No tienes permiso para esta operación. Inicia sesión como administrador.";
  if (error?.code === "unavailable")
    return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  return "No se pudo completar la operación. Intenta de nuevo.";
}

$form.addEventListener("submit", async (evento) => {
  evento.preventDefault();                       // sin esto la página se recarga

  const datos = leerFormulario();
  const errores = validarProducto(datos);
  if (errores.length) {
    mostrarErroresFormulario(errores);
    return;                                      // NO se escribe nada en Firestore
  }

  $btnGuardar.disabled = true;
  $btnGuardar.textContent = "Guardando...";
  try {
    if (productoEditandoId) await actualizarProducto(productoEditandoId, datos);
    else await crearProducto(datos);
    $dialogo.close();
    await cargarCatalogo();                      // se vuelve a leer: se muestra el estado REAL de la base
    mostrarMensaje($mensaje, "Máquina guardada correctamente.", "exito");
  } catch (error) {
    console.error(error);
    mostrarMensaje($msgDialogo, textoError(error), "error");
  } finally {
    $btnGuardar.disabled = false;                // siempre se reactiva el botón
    $btnGuardar.textContent = "Guardar máquina";
  }
});

$form.querySelector("[data-cerrar]").addEventListener("click", () => $dialogo.close());

async function confirmarEliminacion(id, boton) {
  const p = productos.find((x) => x.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar la máquina ${p.nombre}? Esta acción no se puede deshacer.`)) return;

  boton.disabled = true;
  boton.textContent = "Eliminando...";
  try {
    await eliminarProducto(id);
    await cargarCatalogo();
    mostrarMensaje($mensaje, `Máquina «${p.nombre}» eliminada correctamente.`, "exito");
  } catch (error) {
    console.error(error);
    mostrarMensaje($mensaje, textoError(error), "error");
    boton.disabled = false;
    boton.textContent = "Eliminar";
  }
}

$btnNuevo.addEventListener("click", () => abrirFormulario());

/* ====================================================================
   5. INICIO: primero se conoce el rol y DESPUÉS se pinta el primer catálogo
   ==================================================================== */
async function inicializar() {
  mostrarCarga();
  try {
    const sesion = await obtenerSesionActual();
    esAdmin = sesion?.rol === "admin";
  } catch (error) {
    console.error(error);
    esAdmin = false;                             // ante la duda, nunca admin
  }
  $btnNuevo.hidden = !esAdmin;                   // solo experiencia de usuario: la seguridad real son las reglas
  await cargarCatalogo();
}

inicializar();
