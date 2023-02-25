// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfWBY9F09_puhg0PmIR1EOobcVyqs1vuU",
  authDomain: "customchat-bot.firebaseapp.com",
  projectId: "customchat-bot",
  storageBucket: "customchat-bot.appspot.com",
  messagingSenderId: "373633123977",
  appId: "1:373633123977:web:87c0d1cbf965b8ed6a6858"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)
