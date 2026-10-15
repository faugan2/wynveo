/**
 * Initialisation Firebase (syntaxe v8 compat, comme admin)
 * Compatible avec db.collection() et auth.signInWithEmailAndPassword()
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

console.log('[Firebase] Status:', {
  configured: !!isFirebaseConfigured,
  dataSource: import.meta.env.VITE_DATA_SOURCE,
  apiKey: firebaseConfig.apiKey ? '✓' : '✗',
});

let auth = null;
let db = null;

if (isFirebaseConfigured) {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  auth = firebase.auth();
  db = firebase.firestore();
} else {
  if (import.meta.env.VITE_DATA_SOURCE === 'firebase') {
    throw new Error('Firebase credentials missing! Check .env.local');
  }
  console.warn('[Firebase] Skipped (mock mode)');
}

export { auth, db };
