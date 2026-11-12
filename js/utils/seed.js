// js/utils/seed.js
// ============================================================================
// ESTE ARCHIVO NO SE IMPORTA EN NINGUNA PÁGINA (ni en un <script> de HTML ni en otro módulo).
// Se conserva en el repositorio solo como EVIDENCIA de los datos iniciales del catálogo (Req. 7).
// Los 6 equipos ya están cargados en Firestore. NO lo importes ni lo ejecutes: setDoc()
// sobrescribiría los cambios que se hagan desde el CRUD (y con las reglas publicadas,
// solo un administrador podría escribir de todas formas).
// Si algún día hay que volver a sembrar: ejecutarlo UNA vez como admin y retirar el import.
// ============================================================================
import { db } from "../config/firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const maquinasIniciales = [
  {
    id: "395-xr",
    nombre: "Delta 395 XR (Ultra Max II)",
    linea: "Línea Ultra",
    motor: "Brushless 220V",
    potenciaW: 1500,
    caudalLMin: 2.0,
    presionMPa: 22.25,
    boquilla: "0.015 IN - 0.021 IN",
    pesoKg: 16.5,
    produccion: "5-8 m² por minuto",
    resistencia: "3-4 Horas (Descanso 45M / 15M cada 40M)",
    estilo: "Portátil",
    idealPara: "Pinturas base agua, aceite, anticorrosivas e impermeables.",
    imagenUrl: "img/395 XR ULTRA.jpeg",
    activo: true
  },
  {
    id: "495-xr",
    nombre: "Delta 495 XR (Ultra Max II)",
    linea: "Línea Ultra",
    motor: "Brushless 110V",
    potenciaW: 2300,
    caudalLMin: 2.4,
    presionMPa: 22.25,
    boquilla: "0.017 IN - 0.023 IN",
    pesoKg: 17,
    produccion: "5-8 m² por minuto",
    resistencia: "3-4 Horas (Descanso 45M)",
    estilo: "Portátil",
    idealPara: "Base agua, aceite, antioxidantes, epóxica para suelos e impermeables de techo.",
    imagenUrl: "img/495 XR ULTRA.jpeg",
    activo: true
  },
  {
    id: "1095-xp",
    nombre: "Delta Ultra 1095 XP",
    linea: "Línea Ultra",
    motor: "Brushless 110V",
    potenciaW: 3000,
    caudalLMin: 4.8,
    presionMPa: 22.27,
    boquilla: "0.023 IN - 0.037 IN",
    pesoKg: 38,
    produccion: "6-10 m² por minuto",
    resistencia: "4-5 Horas (Descanso 45M)",
    estilo: "Portátil",
    idealPara: "Base agua, aceite, antioxidantes, epóxica y anticorrosivos industriales.",
    imagenUrl: "img/ULTRA 1095 XP.jpeg",
    activo: true
  },
  {
    id: "mark-v",
    nombre: "Delta Ultra Mark V",
    linea: "Línea Ultra",
    motor: "Brushless 110V",
    potenciaW: 4000,
    caudalLMin: 6.3,
    presionMPa: 22.27,
    boquilla: "0.025 IN - 0.047 IN",
    pesoKg: 42,
    produccion: "6-10 m² por minuto",
    resistencia: "4-5 Horas (Descanso 45M)",
    estilo: "Portátil",
    idealPara: "Base agua, aceite, yeso para tabla roca, epóxica y revestimientos.",
    imagenUrl: "img/ULTRA MARK V.jpeg",
    activo: true
  },
  {
    id: "h20-1s",
    nombre: "Delta H20-1S (Señalización Vial)",
    linea: "Señalización vial",
    motor: "HONDA 6.5 HP",
    potenciaW: null,
    caudalLMin: 10.0,
    presionMPa: 22.27,
    boquilla: "0.017 IN - 0.049 IN",
    pesoKg: 125,
    produccion: null,
    resistencia: null,
    estilo: "Portátil",
    idealPara: "Señalización vial de alto rendimiento.",
    imagenUrl: "img/H20-1.jpeg",
    activo: true
  },
  {
    id: "h20-4",
    nombre: "Delta H20-4 (Señalización Vial)",
    linea: "Señalización vial",
    motor: "HONDA 6.5 HP",
    potenciaW: null,
    caudalLMin: 10.0,
    presionMPa: 22.27,
    boquilla: "0.017 IN - 0.049 IN",
    pesoKg: 125,
    produccion: null,
    resistencia: null,
    estilo: "Portátil",
    idealPara: "Señalización vial de alto rendimiento.",
    imagenUrl: "img/H20-4.jpeg",
    activo: true
  }
];

export async function sembrarProductosIniciales() {
  try {
    console.log("Iniciando carga de equipos en Firestore...");
    for (const maquina of maquinasIniciales) {
      const { id, ...datosMaquina } = maquina;
      await setDoc(doc(db, "productos", id), datosMaquina);
      console.log(`Equipo cargado: ${datosMaquina.nombre}`);
    }
    alert("Los 6 equipos Delta Airless se cargaron correctamente en Firestore.");
  } catch (error) {
    console.error("Error al subir los equipos:", error);
    alert("Error al cargar los datos. Revisa la consola del navegador.");
  }
}

// Ejecución inmediata al cargar el script
//sembrarProductosIniciales(); Ya están cargados