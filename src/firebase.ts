// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    // AQUI VA LA API KEY DE FIRABASE
  apiKey: "AIzaSyDBzt-0wtvvQfbLfSY1ywRxZkpqOgToilk",
  authDomain: "softwarlifterdb.firebaseapp.com",
  projectId: "softwarlifterdb",
  storageBucket: "softwarlifterdb.firebasestorage.app",
  messagingSenderId: "1068528478319",
  appId: "1:1068528478319:web:c6f8c81acfc47c846f859a",
  measurementId: "G-4X9ZC0LH7S",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);