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

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
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
