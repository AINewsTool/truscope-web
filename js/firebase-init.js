// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB07avalIpRbiwFjOqSguaoxS4lRswNl_U",
  authDomain: "biasdetectorextension.firebaseapp.com",
  projectId: "biasdetectorextension",
  storageBucket: "biasdetectorextension.firebasestorage.app",
  messagingSenderId: "664962798895",
  appId: "1:664962798895:web:81f296bfec93bb7c603dda",
  measurementId: "G-ZK7XV5948Y"
};

// Initialize Firebase
// SECURITY NOTE: Ensure your Firebase Security Rules (Firestore/Storage) are configured to allow only authenticated users to access data where appropriate.
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = getAnalytics(app);
export { analytics, logEvent };

// Auth instance
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Firestore instance
export const db = getFirestore(app);
