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
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

console.log('[Firebase] Initialized:', {
  configured: !!isFirebaseConfigured,
  apiKey: firebaseConfig.apiKey ? 'present' : 'MISSING',
  authDomain: firebaseConfig.authDomain ? 'present' : 'MISSING',
  projectId: firebaseConfig.projectId ? 'present' : 'MISSING',
  dataSource: import.meta.env.VITE_DATA_SOURCE,
});

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
} else {
  if (import.meta.env.VITE_DATA_SOURCE === 'firebase') {
    throw new Error('Firebase credentials missing! Check .env.local or apps/player/.env');
  }
  console.warn('[Firebase] Skipped (mock mode)');
  export const auth = null;
  export const db = null;
}
