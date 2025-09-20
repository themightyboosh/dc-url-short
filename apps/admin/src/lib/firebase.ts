import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCUw3U0kNZ35SWL2Z-L0hpfJex4-xcn31I",
  authDomain: "moni-url-short.firebaseapp.com",
  projectId: "moni-url-short",
  storageBucket: "moni-url-short.firebasestorage.app",
  messagingSenderId: "460112494644",
  appId: "1:460112494644:web:6a8045f7c74202e62fca61"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
