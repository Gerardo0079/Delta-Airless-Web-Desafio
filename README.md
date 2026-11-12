
# Delta Airless — Catálogo, servicios y solicitudes

Sitio web de **Delta Airless / Grupo Partes El Salvador**.

Presenta maquinaria de pintura Airless, explica los servicios técnicos y permite a los clientes solicitar cotizaciones, mantenimiento, reparaciones y repuestos. El administrador gestiona el catálogo y responde las solicitudes.

## Problema que resuelve

Un cliente necesita identificar el equipo adecuado y solicitar ayuda sin depender exclusivamente de llamadas o mensajes dispersos.

El equipo de atención necesita una bandeja centralizada para revisar cada solicitud, responderla y conocer cuántas siguen pendientes.

## Procesos principales

### 1. Registro e inicio de sesión

Firebase Authentication autentica con correo y contraseña.

El perfil del usuario, incluyendo su rol, se almacena en:

`usuarios/{uid}`

### 2. Catálogo de productos

La página `productos.html` permite buscar y consultar equipos.

El administrador puede crear, editar y ocultar productos.

### 3. Envío de solicitudes

Un cliente autenticado ingresa a `contacto.html`.

Selecciona el tipo de solicitud, un modelo o la opción "Aún no lo sé", completa sus datos y envía el formulario.

La solicitud se crea con estado **Pendiente**.

### 4. Mis solicitudes

Cada cliente puede consultar únicamente sus propias solicitudes.

También puede cancelar aquellas que todavía se encuentran Pendientes.

### 5. Panel administrativo

El administrador puede:

- Visualizar todas las solicitudes.
- Filtrar por estado.
- Escribir una respuesta técnica.
- Cambiar el estado de una solicitud.
- Consultar indicadores estadísticos.

Aprobar o finalizar una solicitud requiere una respuesta técnica.

### 6. Indicadores administrativos

El sistema muestra cuatro KPIs:

- Total de solicitudes.
- Cantidad de cotizaciones.
- Cantidad de servicios técnicos.
- Solicitudes Pendientes.

Los indicadores se recalculan al guardar los cambios, sin recargar la página.

## Estados de solicitudes

Los estados disponibles son:

1. Pendiente
2. En revisión
3. Aprobada
4. Finalizada
5. Cancelada

## Roles y permisos

| Rol | Permisos |
| --- | --- |
| Visitante | Navegar por páginas públicas e iniciar sesión |
| Cliente | Crear, consultar y cancelar solicitudes propias Pendientes |
| Administrador | Gestionar productos, consultar todas las solicitudes y responderlas |

El registro público siempre asigna el rol `cliente`.

No existe autorregistro de administradores.

El rol administrador debe asignarse por un responsable autorizado mediante Firebase.

## Tecnologías

- HTML5
- CSS3
- JavaScript ES Modules
- Firebase Authentication
- Cloud Firestore
- Firebase JavaScript SDK 13.2.0
- Live Server o servidor HTTP local

## Estructura del proyecto

```text
.
├── index.html
├── productos.html
├── servicios.html
├── contacto.html
├── login.html
├── css/
│   ├── style.css
│   ├── componentes.css
│   ├── catalogo.css
│   ├── auth.css
│   └── solicitudes.css
├── js/
│   ├── config/
│   │   └── firebase.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── productos.service.js
│   │   └── solicitudes.service.js
│   ├── ui/
│   │   ├── auth.ui.js
│   │   ├── header.ui.js
│   │   ├── productos.ui.js
│   │   └── solicitudes.ui.js
│   └── utils/
│       ├── dom.js
│       └── seed.js
├── img/
├── firestore.rules
└── docs/
    └── pruebas-solicitudes.md
```

## Colecciones de Firestore

### usuarios

Ruta:

`usuarios/{uid}`

Campos:

- nombre
- empresa
- telefono
- correo
- rol
- fechaRegistro

El identificador del documento coincide con el UID real de Firebase Authentication.

### productos

Ruta:

`productos/{productoId}`

Campos:

- nombre
- linea
- motor
- potenciaW
- caudalLMin
- presionMPa
- boquilla
- pesoKg
- produccion
- resistencia
- estilo
- idealPara
- imagenUrl
- activo

### solicitudes

Ruta:

`solicitudes/{solicitudId}`

Campos:

- uidCliente
- nombreCliente
- empresa
- correo
- telefono
- tipoSolicitud
- productoId
- modeloNombre
- cantidad
- fechaPreferida
- mensaje
- estado
- respuestaAdmin
- fechaCreacion

Los tipos de solicitud son:

- cotizacion
- mantenimiento
- reparacion
- repuestos

Cuando el cliente selecciona "Aún no lo sé", el campo `productoId` se guarda como una cadena vacía y `modeloNombre` como "Aún no lo sé".

## Seguridad

Las reglas de seguridad se encuentran en `firestore.rules`.

Deben publicarse en Firebase para entrar en funcionamiento.

El sistema restringe la lectura de solicitudes al cliente propietario o a un administrador.

El cliente solamente puede cancelar una solicitud propia que siga Pendiente.

El UID de una solicitud se obtiene de la sesión de Firebase Authentication.

Los usuarios no pueden registrarse directamente como administradores.

Los datos mostrados en la interfaz se escapan para evitar la interpretación de HTML ingresado por usuarios.

No se deben almacenar contraseñas, claves privadas ni archivos de cuentas de servicio en el repositorio.

La interfaz y el servicio exigen una respuesta técnica para aprobar o finalizar. Las reglas de Firestore también exigen que la respuesta almacenada no esté vacía.

## Cómo ejecutar el proyecto

Es necesario utilizar un servidor HTTP local debido al uso de JavaScript ES Modules.

Desde la raíz del proyecto:

```bash
python -m http.server 5500
```

Después, abrir:

http://localhost:5500/contacto.html

### URLs de prueba

Página principal:

http://localhost:5500/index.html

Catálogo:

http://localhost:5500/productos.html

Servicios:

http://localhost:5500/servicios.html

Contacto:

http://localhost:5500/contacto.html

Formulario directo:

http://localhost:5500/contacto.html#formulario

Login con regreso a Contacto:

http://localhost:5500/login.html?volver=contacto.html

La URL pública del despliegue debe incorporarse cuando esté confirmada.

## Pruebas de aceptación

### Prueba 1: Visitante

Abrir Contacto sin iniciar sesión.

Resultado esperado:

- Se muestra un aviso para iniciar sesión.
- Aparece un enlace al login.
- El botón Enviar solicitud está deshabilitado.

### Prueba 2: Enviar solicitud

Ingresar como cliente.

Completar el formulario y enviarlo.

Resultado esperado:

- Se valida la información.
- Se muestra un mensaje de éxito.
- La solicitud aparece en Mis solicitudes.
- El estado inicial es Pendiente.

### Prueba 3: Privacidad

Iniciar sesión como cliente1 y crear una solicitud.

Cerrar sesión e ingresar como cliente2.

Resultado esperado:

Cliente2 no puede visualizar la solicitud de cliente1.

### Prueba 4: Cancelación

Como cliente, cancelar una solicitud Pendiente.

Resultado esperado:

- El estado cambia a Cancelada.
- Desaparece el botón Cancelar de esa solicitud.

### Prueba 5: Administración

Iniciar sesión con una cuenta administradora.

Actualizar el estado y la respuesta de una solicitud.

Resultado esperado:

- Los cambios se guardan.
- La tarjeta refleja el estado actualizado.
- Los KPIs se recalculan sin recargar la página.

### Prueba 6: Validación de respuesta

Intentar aprobar o finalizar una solicitud sin escribir respuesta técnica.

Resultado esperado:

Se muestra un error y la actualización no se guarda.

## Datos de ejemplo

Consultar el archivo:

`docs/pruebas-solicitudes.md`

Este archivo contiene seis solicitudes propuestas y las instrucciones para comprobar los estados del sistema.

## Integrantes

| Responsabilidad | Integrante |
| --- | --- |
| Persona 1 — Acceso y autenticación | Por completar |
| Persona 2 — Catálogo de productos | Por completar |
| Persona 3 — Solicitudes, contacto y README | Por completar |
