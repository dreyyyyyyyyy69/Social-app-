// Standard imports for Firebase v9 modular SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration for the social app
const firebaseConfig = {
  apiKey: "AIzaSyD3-p_iRXIZtQIirBSri8Fjp8SkYLwSmrU",
  authDomain: "chatty-84d8b.firebaseapp.com",
  databaseURL: "https://chatty-84d8b-default-rtdb.firebaseio.com",
  projectId: "chatty-84d8b",
  storageBucket: "chatty-84d8b.firebasestorage.app",
  messagingSenderId: "656653809303",
  appId: "1:656653809303:web:d9a8df42cb6f4f86ecdbd2"
};

// Initialize Firebase using the modular API
// This fix ensures initializeApp is correctly imported and utilized
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);