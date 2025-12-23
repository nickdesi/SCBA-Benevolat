import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration from environment variables
// IMPORTANT: Set these in your .env.local file
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCkef-S1g3mmR5bSkxnvsM6zs2spQFxnbs",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scba-benevole.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scba-benevole",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scba-benevole.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "472642810664",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:472642810664:web:b2b402825f8f2f4c38161d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

