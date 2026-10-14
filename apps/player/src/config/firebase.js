/**
 * Initialisation Firebase (syntaxe v8 via les modules "compat").
 * Reprend votre fichier de configuration ; seules différences :
 *  - imports officiels "firebase/compat/*" (un seul package npm "firebase") ;
 *  - valeurs lues depuis .env ;
 *  - région des Cloud Functions et émulateurs locaux.
 * Seuls les fichiers de src/services/firebase importent ce module.
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';

const env = import.meta.env;

/**
 * Configuration par défaut : celle de votre projet. Ces valeurs ne sont pas
 * secrètes (Firebase les envoie de toute façon au navigateur) ; la sécurité
 * vient des règles Firestore. Un fichier .env peut les remplacer, par exemple
 * pour pointer vers un autre projet (test / production).
 */
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyB-vQnuHyGK4dVFaFa2N-MZAfextw59HPk',
  authDomain: 'my-streakers.firebaseapp.com',
  projectId: 'my-streakers',
  storageBucket: 'my-streakers.firebasestorage.app',
  messagingSenderId: '990322731756',
  appId: '1:990322731756:web:aa67fc448ca93811fc53c9',
};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULT_CONFIG.appId,
};

let app;
if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const auth = app.auth();
auth.languageCode = 'fr';
const db = app.firestore();
const storage = app.storage();
const functions = app.functions(env.VITE_FUNCTIONS_REGION || 'europe-west1');

if (env.VITE_USE_EMULATORS === 'true') {
  auth.useEmulator('http://127.0.0.1:9099');
  db.useEmulator('127.0.0.1', 8080);
  functions.useEmulator('127.0.0.1', 5001);
  storage.useEmulator('127.0.0.1', 9199);
}

export { auth, db, storage, firebase, functions };
