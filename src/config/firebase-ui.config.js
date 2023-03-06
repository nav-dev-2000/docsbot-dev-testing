// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFU8TVMvWP99bT1fAC5WJKqK1DQ_rHKoQ",
  authDomain: "docsbotai.firebaseapp.com",
  projectId: "docsbotai",
  storageBucket: "docsbotai.appspot.com",
  messagingSenderId: "634153948748",
  appId: "1:634153948748:web:9ca045bd4f820101cf06e9",
  measurementId: "G-X9MJG8Q7SH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)
