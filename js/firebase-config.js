// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  projectId: "insightpro-dashboard-d7a69",
  appId: "1:692753934974:web:ae9bc90cd8d0df9d26062f",
  storageBucket: "insightpro-dashboard-d7a69.firebasestorage.app",
  apiKey: "AIzaSyA9aOdT2kNKXb82weORT1hwc-YoUF15E_0",
  authDomain: "insightpro-dashboard-d7a69.firebaseapp.com",
  messagingSenderId: "692753934974",
  measurementId: "G-8WJT8RT00K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
