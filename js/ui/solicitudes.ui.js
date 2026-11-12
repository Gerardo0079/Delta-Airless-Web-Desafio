
 // Interfaz de solicitudes: clientes, visitantes y administradores.
 // Firestore se consulta únicamente a través de js/services/solicitudes.service.js.
 import { obtenerSesionActual } from "../services/auth.service.js";
 import { obtenerProductos } from "../services/productos.service.js";
 import {
   crearSolicitud,
   obtenerSolicitudesCliente,
   obtenerTodasSolicitudes,
   actualizarEstadoSolicitud,
   cancelarSolicitudCliente
 } from "../services/solicitudes.service.js";
 import { escaparHTML, fechaHoyLocal, mostrarMensaje } from "../utils/dom.js";

 const $formulario = document.getElementById("formulario"); // NO cambiar: servicios.html enlaza a #formulario.
 const $estado = document.getElementById("mensaje-estado");
 const $selectModelo = document.getElementById("modelo");
 const $fecha = document.getElementById("fecha");
 const $enviar = $formulario.querySelector('button[type="submit"]');
 const $seccionCliente = document.getElementById("seccion-mis-solicitudes");
 const $listaCliente = document.getElementById("lista-mis-solicitudes");
 const $panelAdmin = document.getElementById("panel-admin");
 const $kpis = document.getElementById("kpis");
 const $filtroEstado = document.getElementById("filtro-estado");
 const $listaAdmin = document.getElementById("lista-admin");

 const ESTADOS = ["Pendiente", "En revisión", "Aprobada", "Finalizada", "Cancelada"];
 const TIPOS = {
   cotizacion: "Cotización de equipo",
   mantenimiento: "Mantenimiento preventivo",
   reparacion: "Reparación",
   repuestos: "Repuestos y accesorios"
 };
 const CLASES_ESTADO = {
   "Pendiente": "badge-pendiente",
   "En revisión": "badge-en-revision",
   "Aprobada": "badge-aprobada",
   "Finalizada": "badge-finalizada",
   "Cancelada": "badge-cancelada"
 };

 let sesion = null;
 let solicitudesCliente = [];
 let solicitudesAdmin = [];

 function textoError(error) {
   if (error?.code === "permission-denied")
     return "No tienes permiso para esta operación. Verifica tu sesión.";
   if (error?.code === "unavailable")
     return "No hay conexión con Firebase. Intenta de nuevo.";
   if (error?.code === "solicitud/sin-sesion")
     return "Tu sesión terminó. Inicia sesión de nuevo.";
   return "No se pudo completar la operación. Intenta de nuevo.";
 }

 function avisoIniciarSesion() {
   mostrarMensaje($estado, "Para enviar solicitudes, inicia sesión:", "info");
   const enlace = document.createElement("a");
   enlace.href = "login.html?volver=contacto.html";
   enlace.textContent = " Iniciar sesión o crear cuenta";
   $estado.append(enlace);
   $enviar.disabled = true;
 }

 function crearOpcion(texto, valor) {
   const opcion = document.createElement("option");
   opcion.textContent = texto;
   opcion.value = valor;
   return opcion;
 }

 async function inicializarSelectorModelos() {
   $selectModelo.replaceChildren(
     crearOpcion("Selecciona un modelo", ""),
     crearOpcion("Aún no lo sé", "no-se")
   );
   try {
     const productos = await obtenerProductos();
     const opciones = productos.filter(p => p.activo !== false)
       .map(p => crearOpcion(p.nombre, p.id));
     $selectModelo.replaceChildren(
       crearOpcion("Selecciona un modelo", ""),
       ...opciones,
       crearOpcion("Aún no lo sé", "no-se")
     );
     const parametro = new URLSearchParams(window.location.search).get("modelo");
     // No seleccionar una opción inexistente, aunque haya un ?modelo= en la URL.
     if (parametro && [...$selectModelo.options].some(o => o.value === parametro)) {
       $selectModelo.value = parametro;
     }
   } catch (error) {
     console.error("No se pudo cargar el selector de modelos:", error);
     // El visitante todavía puede indicar que desconoce el modelo.
   }
 }

 function prellenarDatos(perfil) {
   const campos = { nombre: "nombre", empresa: "empresa", correo: "correo", telefono: "telefono" };
   for (const [id, propiedad] of Object.entries(campos)) {
     document.getElementById(id).value = perfil?.[propiedad] ?? "";
   }
 }

 function leerSolicitud() {
   const productoId = $selectModelo.value === "no-se" ? "" : $selectModelo.value;
   const modeloNombre = productoId
     ? $selectModelo.selectedOptions[0]?.textContent ?? ""
     : "Aún no lo sé";
   return {
     nombreCliente: document.getElementById("nombre").value.trim(),
     empresa: document.getElementById("empresa").value.trim(),
     correo: document.getElementById("correo").value.trim(),
     telefono: document.getElementById("telefono").value.trim(),
     tipoSolicitud: $formulario.querySelector('input[name="solicitud"]:checked')?.value ?? "",
     productoId,
     modeloNombre,
     cantidad: Number(document.getElementById("cantidad").value),
     fechaPreferida: $fecha.value,
     mensaje: document.getElementById("mensaje").value.trim()
   };
 }

 function validarSolicitud(datos) {
   const errores = [];
   if (!Object.hasOwn(TIPOS, datos.tipoSolicitud))
     errores.push("Selecciona un tipo de solicitud válido.");
   if (!Number.isInteger(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > 50)
     errores.push("La cantidad debe ser un entero entre 1 y 50.");
   if (datos.fechaPreferida && datos.fechaPreferida < fechaHoyLocal())
     errores.push("La fecha preferida no puede ser anterior a hoy.");
   if (datos.mensaje.length < 10 || datos.mensaje.length > 500)
     errores.push("El mensaje debe tener entre 10 y 500 caracteres.");
   if (datos.productoId && ![...$selectModelo.options].some(o => o.value === datos.productoId))
     errores.push("Selecciona un modelo válido.");
   return errores;
 }

 function badgeEstado(estado) {
   const clase = CLASES_ESTADO[estado] ?? "badge-cancelada";
   return `<span class="badge ${clase}">${escaparHTML(estado || "Sin estado")}</span>`;
 }

 function fechaLegible(iso) {
   if (!iso) return "Sin fecha";
   const fecha = new Date(iso);
   return Number.isNaN(fecha.getTime()) ? "Sin fecha" : fecha.toLocaleString("es-SV");
 }

 function datosSolicitud(solicitud, incluirCliente = false) {
   const s = solicitud;
   return `
     <div class="solicitud-detalles">
       ${incluirCliente ? `<p><strong>Cliente:</strong> ${escaparHTML(s.nombreCliente)} (${escaparHTML(s.correo)})</p>` : ""}
       ${incluirCliente ? `<p><strong>Teléfono:</strong> ${escaparHTML(s.telefono)}</p>` : ""}
       <p><strong>Modelo:</strong> ${escaparHTML(s.modeloNombre || "Aún no lo sé")}</p>
       <p><strong>Cantidad:</strong> ${escaparHTML(s.cantidad)}</p>
       <p><strong>Fecha preferida:</strong> ${escaparHTML(s.fechaPreferida || "No indicada")}</p>
       <p><strong>Creada:</strong> ${escaparHTML(fechaLegible(s.fechaCreacion))}</p>
     </div>
     <p class="solicitud-mensaje"><strong>Solicitud:</strong> ${escaparHTML(s.mensaje)}</p>
     ${s.respuestaAdmin ? `<p class="solicitud-respuesta"><strong>Respuesta técnica:</strong> ${escaparHTML(s.respuestaAdmin)}</p>` : ""}
   `;
 }

 function tarjetaCliente(s) {
   return `
     <article class="tarjeta-solicitud">
       <header class="solicitud-cabecera">
         <h3>${escaparHTML(TIPOS[s.tipoSolicitud] ?? s.tipoSolicitud)}</h3>
         ${badgeEstado(s.estado)}
       </header>
       ${datosSolicitud(s)}
       ${s.estado === "Pendiente" ? `
         <button type="button" class="btn-secundario btn-cancelar-solicitud"
           data-cancelar="${escaparHTML(s.id)}">Cancelar solicitud</button>` : ""}
     </article>
   `;
 }

 function pintarCliente() {
   $listaCliente.innerHTML = solicitudesCliente.length
     ? solicitudesCliente.map(tarjetaCliente).join("")
     : '<p class="estado-vacio">Todavía no has enviado solicitudes.</p>';
 }

 async function cargarSolicitudesCliente() {
   $listaCliente.innerHTML = '<p class="estado-carga">Cargando tus solicitudes...</p>';
   try {
     solicitudesCliente = await obtenerSolicitudesCliente(sesion.uid);
     pintarCliente();
   } catch (error) {
     console.error(error);
     $listaCliente.innerHTML = '<p class="mensaje mensaje-error" role="alert">No se pudieron cargar tus solicitudes.</p>';
   }
 }

 function calcularKPIs(solicitudes) {
   return {
     total: solicitudes.length,
     cotizaciones: solicitudes.filter(s => s.tipoSolicitud === "cotizacion").length,
     servicios: solicitudes.filter(s => ["mantenimiento", "reparacion"].includes(s.tipoSolicitud)).length,
     pendientes: solicitudes.filter(s => s.estado === "Pendiente").length
   };
 }

 function pintarKPIs() {
   const indicadores = calcularKPIs(solicitudesAdmin);
   const etiquetas = {
     total: "Solicitudes totales",
     cotizaciones: "Cotizaciones",
     servicios: "Servicios técnicos",
     pendientes: "Pendientes"
   };
   $kpis.innerHTML = Object.entries(etiquetas).map(([clave, etiqueta]) => `
     <article class="kpi-tarjeta">
       <span class="kpi-etiqueta">${etiqueta}</span>
       <strong class="kpi-valor">${indicadores[clave]}</strong>
     </article>
   `).join("");
 }

 function tarjetaAdmin(s) {
   const idEscapado = escaparHTML(s.id);
   const opciones = ESTADOS.map(estado => `
     <option value="${escaparHTML(estado)}" ${s.estado === estado ? "selected" : ""}>
       ${escaparHTML(estado)}
     </option>`).join("");
   return `
     <article class="tarjeta-solicitud tarjeta-solicitud-admin">
       <header class="solicitud-cabecera">
         <h3>${escaparHTML(TIPOS[s.tipoSolicitud] ?? s.tipoSolicitud)}</h3>
         ${badgeEstado(s.estado)}
       </header>
       ${datosSolicitud(s, true)}
       <form class="form-admin-solicitud" data-id="${idEscapado}">
         <div class="admin-campos">
           <div class="campo-formulario">
             <label for="estado-${idEscapado}">Estado</label>
             <select id="estado-${idEscapado}" name="estado">${opciones}</select>
           </div>
           <div class="campo-formulario">
             <label for="respuesta-${idEscapado}">Respuesta técnica</label>
             <textarea id="respuesta-${idEscapado}" name="respuestaAdmin" rows="3"
               maxlength="2000" placeholder="Detalle de revisión o solución">${escaparHTML(s.respuestaAdmin)}</textarea>
           </div>
         </div>
         <button class="btn-primario" type="submit">Guardar</button>
       </form>
     </article>
   `;
 }

 function pintarAdmin() {
   const estado = $filtroEstado.value;
   const filtradas = solicitudesAdmin.filter(s => !estado || s.estado === estado);
   $listaAdmin.innerHTML = filtradas.length
     ? filtradas.map(tarjetaAdmin).join("")
     : '<p class="estado-vacio">No hay solicitudes para este estado.</p>';
 }

 async function cargarPanelAdmin() {
   $listaAdmin.innerHTML = '<p class="estado-carga">Cargando solicitudes...</p>';
   try {
     solicitudesAdmin = await obtenerTodasSolicitudes();
     pintarKPIs();
     pintarAdmin();
   } catch (error) {
     console.error(error);
     $listaAdmin.innerHTML = '<p class="mensaje mensaje-error" role="alert">No se pudo cargar el panel administrativo.</p>';
   }
 }

 $formulario.addEventListener("submit", async (evento) => {
   evento.preventDefault();
   if ($enviar.disabled || !sesion || sesion.rol !== "cliente") return;
   if (!$formulario.reportValidity()) return;
   const datos = leerSolicitud();
   const errores = validarSolicitud(datos);
   if (errores.length) {
     mostrarMensaje($estado, errores.join(" "), "error");
     return;
   }

   const textoOriginal = $enviar.textContent;
   $enviar.disabled = true;
   $enviar.textContent = "Enviando solicitud...";
   try {
     const sesionActual = await obtenerSesionActual();
     if (!sesionActual?.uid || sesionActual.uid !== sesion.uid) {
       sesion = null;
       avisoIniciarSesion();
       return;
     }
     // El servicio toma el uid de Firebase Auth, nunca de un campo del formulario.
     await crearSolicitud(datos);
     mostrarMensaje($estado, "¡Solicitud enviada correctamente! Puedes verla en Mis solicitudes.", "exito");
     $formulario.reset();
     prellenarDatos(sesionActual);
     await cargarSolicitudesCliente();
   } catch (error) {
     console.error(error);
     mostrarMensaje($estado, textoError(error), "error");
   } finally {
     $enviar.disabled = !sesion || sesion.rol !== "cliente";
     $enviar.textContent = textoOriginal;
   }
 });

 $listaCliente.addEventListener("click", async (evento) => {
   const boton = evento.target.closest("button[data-cancelar]");
   if (!boton || sesion?.rol !== "cliente") return;
   const solicitud = solicitudesCliente.find(s => s.id === boton.dataset.cancelar);
   if (!solicitud || solicitud.estado !== "Pendiente") return;
   if (!confirm("¿Cancelar esta solicitud? No podrás revertir la cancelación.")) return;

   boton.disabled = true;
   try {
     await cancelarSolicitudCliente(solicitud.id);
     solicitud.estado = "Cancelada";
     pintarCliente();
     mostrarMensaje($estado, "La solicitud fue cancelada.", "exito");
   } catch (error) {
     console.error(error);
     mostrarMensaje($estado, textoError(error), "error");
     await cargarSolicitudesCliente(); // Refresca por si el administrador cambió el estado.
   } finally {
     boton.disabled = false;
   }
 });

 $listaAdmin.addEventListener("submit", async (evento) => {
   const formulario = evento.target.closest("form[data-id]");
   if (!formulario) return;
   evento.preventDefault();
   if (sesion?.rol !== "admin") return;
   const solicitud = solicitudesAdmin.find(s => s.id === formulario.dataset.id);
   if (!solicitud) return;

   const estado = formulario.elements.estado.value;
   const respuesta = formulario.elements.respuestaAdmin.value.trim();
   if (!ESTADOS.includes(estado)) {
     mostrarMensaje($estado, "Selecciona un estado válido.", "error");
     return;
   }
   if (["Aprobada", "Finalizada"].includes(estado) && !respuesta) {
     mostrarMensaje($estado, "Para aprobar o finalizar debes escribir una respuesta técnica.", "error");
     formulario.elements.respuestaAdmin.focus();
     return;
   }

   const boton = formulario.querySelector('button[type="submit"]');
   boton.disabled = true;
   boton.textContent = "Guardando...";
   try {
     await actualizarEstadoSolicitud(solicitud.id, estado, respuesta);
     solicitud.estado = estado;
     solicitud.respuestaAdmin = respuesta;
     pintarKPIs(); // Actualización inmediata, sin recargar la página.
     pintarAdmin();
     mostrarMensaje($estado, "Estado y respuesta técnica guardados correctamente.", "exito");
   } catch (error) {
     console.error(error);
     mostrarMensaje($estado, textoError(error), "error");
   } finally {
     boton.disabled = false;
     boton.textContent = "Guardar";
   }
 });

 $filtroEstado.addEventListener("change", pintarAdmin);
 $formulario.addEventListener("reset", () => {
   queueMicrotask(() => prellenarDatos(sesion));
 });

 async function iniciar() {
   $enviar.disabled = true;
   $fecha.min = fechaHoyLocal(); // Fecha local, no UTC ni valor fijo en HTML.
   try {
     sesion = await obtenerSesionActual();
     if (sesion?.rol === "admin") {
       $formulario.hidden = true;
       $panelAdmin.hidden = false;
       await cargarPanelAdmin();
     } else {
       $seccionCliente.hidden = !sesion;
       $enviar.disabled = !sesion;
       if (sesion) {
         prellenarDatos(sesion);
         await cargarSolicitudesCliente();
       } else {
         avisoIniciarSesion();
       }
       await inicializarSelectorModelos();
     }
   } catch (error) {
     console.error("Error inicializando solicitudes:", error);
     mostrarMensaje($estado, "No se pudo verificar la sesión. Intenta recargar la página.", "error");
     $enviar.disabled = true;
   }
 }

 iniciar();
