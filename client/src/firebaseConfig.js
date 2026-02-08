import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDta1Z02aqGopcvuZTLPH1-AJRehMRDTAM",
    authDomain: "fuelnfix-5a36d.firebaseapp.com",
    projectId: "fuelnfix-5a36d",
    storageBucket: "fuelnfix-5a36d.firebasestorage.app",
    messagingSenderId: "98642903971",
    appId: "1:98642903971:web:de5105db047cb5cc5ed016",
    measurementId: "G-X1236ZRWGV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
