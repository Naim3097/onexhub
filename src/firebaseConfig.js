// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2DvrwwS4GE18cdvUP3hdcb3QS7",
  authDomain: "onexhub-b92b2.firebaseapp.com",
  projectId: "onexhub-b92b2",
  storageBucket: "onexhub-b92b2.firebasestorage.app",
  messagingSenderId: "598436598669",
  appId: "1:598436598669:web:5f4418caa0fb3bd3dfa3e5"
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
