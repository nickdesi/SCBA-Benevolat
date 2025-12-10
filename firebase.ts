import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkef-S1g3mmR5bSkxnvsM6zs2spQFxnbs",
    authDomain: "scba-benevole.firebaseapp.com",
    projectId: "scba-benevole",
    storageBucket: "scba-benevole.firebasestorage.app",
    messagingSenderId: "472642810664",
    appId: "1:472642810664:web:b2b402825f8f2f4c38161d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
