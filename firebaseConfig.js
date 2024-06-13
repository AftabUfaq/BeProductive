import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';



// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCO1MgyXG9SS9t5jOb2M39lc1QzEN9wyGk",
  authDomain: "beproductive-12345.firebaseapp.com",
  projectId: "beproductive-12345",
  storageBucket: "beproductive-12345.appspot.com",
  messagingSenderId: "989514152507",
  appId: "1:989514152507:web:919ba083f9aba04e187a1e",
  measurementId: "G-LRQLFTJPTZ"
};
// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, app, db }; // Export the auth and app instances for use in your components