import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCvJnL8dmUEjKxetnPYwh26XVgrJYBYFE0",
  authDomain: "fancentro-11.firebaseapp.com",
  projectId: "fancentro-11",
  storageBucket: "fancentro-11.firebasestorage.app",
  messagingSenderId: "650744872019",
  appId: "1:650744872019:web:fd65d5d95b1c608c935aa6",
  measurementId: "G-12Z1YQHPHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);