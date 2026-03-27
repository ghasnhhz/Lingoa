// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7ZKIf73SzEAWNXS_Tfn-OkMk_XOCojqo",
  authDomain: "english-quiz-app-83c8e.firebaseapp.com",
  projectId: "english-quiz-app-83c8e",
  storageBucket: "english-quiz-app-83c8e.firebasestorage.app",
  messagingSenderId: "1014801249485",
  appId: "1:1014801249485:web:480cb37cde1d48f7b0a584",
  measurementId: "G-95PLF3JCHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export {app, analytics}