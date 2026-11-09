import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

 const firebaseConfig = {
    apiKey: "AIzaSyCyvcct3kL6iv2vFdkhha4tXz5XEUWNyhs",
    authDomain: "delta-airless-web-desafio-ii.firebaseapp.com",
    projectId: "delta-airless-web-desafio-ii",
    storageBucket: "delta-airless-web-desafio-ii.firebasestorage.app",
    messagingSenderId: "540526061674",
    appId: "1:540526061674:web:c7a513c35d02a78cebc213",
    measurementId: "G-3889LJX46H"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
