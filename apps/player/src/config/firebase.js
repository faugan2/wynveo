import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Validate Firebase config before initializing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug log
console.log('[Firebase Config Debug]', {
  dataSource: import.meta.env.VITE_DATA_SOURCE,
  apiKey: firebaseConfig.apiKey ? '✓ (present)' : '✗ (missing)',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Check if Firebase is properly configured
const isFirebaseConfigured = Object.values(firebaseConfig).every(val => val && typeof val === 'string' && val.trim() !== '');

if (!isFirebaseConfigured) {
  if (import.meta.env.VITE_DATA_SOURCE === 'firebase') {
    throw new Error('Firebase is not configured! Set VITE_DATA_SOURCE=mock or fill in Firebase credentials in .env');
  }
  console.warn('[Firebase] Skipped: Not configured (using mock mode)');
}

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
