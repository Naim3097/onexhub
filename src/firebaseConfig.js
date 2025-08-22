// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration - CORRECT FROM CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBkYbWweI3F_Zulo35_bhpeOcodURbFMXA",
  authDomain: "oxhub-42c99.firebaseapp.com",
  projectId: "oxhub-42c99",
  storageBucket: "oxhub-42c99.firebasestorage.app",
  messagingSenderId: "319585203062",
  appId: "1:319585203062:web:6453438cad0938ebb3c057"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

// Export utilities for network management
export { enableNetwork, disableNetwork }

// Add connection state management
let isOnline = navigator.onLine
window.addEventListener('online', () => { isOnline = true })
window.addEventListener('offline', () => { isOnline = false })
export const getNetworkStatus = () => isOnline

// Log Firebase initialization
console.log('Firebase initialized with project:', firebaseConfig.projectId)
console.log('Firebase Auth initialized successfully')

export default app
