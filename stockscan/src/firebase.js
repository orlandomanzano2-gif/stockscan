import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPrO6B0LpdyZDulnJGtewggjWYuMTkLkI",
  authDomain: "distribuidor-mansif-509e6.firebaseapp.com",
  projectId: "distribuidor-mansif-509e6",
  storageBucket: "distribuidor-mansif-509e6.firebasestorage.app",
  messagingSenderId: "91458074085",
  appId: "1:91458074085:web:f610154ffa396ec9a52b0c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
