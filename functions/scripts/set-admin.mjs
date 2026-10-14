/**
 * Donne un rôle d'administrateur à un compte e-mail (le crée au besoin).
 *
 * Production (clé de compte de service téléchargée depuis la console Firebase) :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node functions/scripts/set-admin.mjs admin@wynveo.com super "MotDePasseSolide"
 * Émulateurs :
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-wynveo node functions/scripts/set-admin.mjs admin@wynveo.com super motdepasse
 *
 * Rôles : super, finance, support, trader. Le rôle "none" retire l'accès.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, role, password] = process.argv.slice(2);
const ROLES = ['super', 'finance', 'support', 'trader', 'none'];

if (!email || !ROLES.includes(role)) {
  console.error('Usage : node set-admin.mjs <email> <super|finance|support|trader|none> [motDePasse]');
  process.exit(1);
}

initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const auth = getAuth();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  if (!password) {
    console.error('Compte inexistant : donnez un mot de passe pour le créer.');
    process.exit(1);
  }
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`Compte créé : ${email}`);
}

await auth.setCustomUserClaims(user.uid, role === 'none' ? { role: null } : { role });
console.log(`${email} -> rôle "${role}". L'admin doit se reconnecter pour que le rôle soit pris en compte.`);
