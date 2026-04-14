// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCx_x9jwkr6kyMfE9YgWjNdKN_OFMdpOEA",
  authDomain: "noisy-wordle.firebaseapp.com",
  projectId: "noisy-wordle",
  storageBucket: "noisy-wordle.firebasestorage.app",
  messagingSenderId: "96964988233",
  appId: "1:96964988233:web:1e0c0c8369bb6a1e021e98",
  measurementId: "G-CJJE2Z5HFN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);