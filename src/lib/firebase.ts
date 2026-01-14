import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if Firebase environment variables are configured
const hasApiKey = !!import.meta.env.VITE_FIREBASE_API_KEY;
const hasProjectId = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
export const isFirebaseConfigured = hasApiKey && hasProjectId;

// Firebase configuration - use dummy values if not configured
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dummy-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dummy-project.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123def456'
};

if (!isFirebaseConfigured) {
  console.warn(
    '⚠️ Firebase is not configured. Please create a .env file with your Firebase credentials.\n' +
    'See SETUP.md for instructions.'
  );
}

// Initialize Firebase with config (dummy or real)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
