import { auth, firebase } from '../../config/firebase.js';
import { wrap } from '../errors.js';

const RECAPTCHA_CONTAINER = 'recaptcha-container';
let verifier = null;

function getVerifier() {
  if (!verifier) {
    verifier = new firebase.auth.RecaptchaVerifier(RECAPTCHA_CONTAINER, { size: 'invisible' });
  }
  return verifier;
}

function resetVerifier() {
  try { verifier?.clear(); } catch { /* déjà nettoyé */ }
  verifier = null;
  const el = document.getElementById(RECAPTCHA_CONTAINER);
  if (el) el.innerHTML = '';
}

export const authService = {
  /** cb(user | null), user = { uid, phone } */
  onAuthChange(cb) {
    return auth.onAuthStateChanged((u) => cb(u ? { uid: u.uid, phone: u.phoneNumber } : null));
  },

  /** Envoie le SMS. Renvoie une session avec confirm(code). */
  startPhoneSignIn: wrap(async (e164) => {
    try {
      const confirmation = await auth.signInWithPhoneNumber(e164, getVerifier());
      return { confirm: wrap(async (code) => { await confirmation.confirm(code); }) };
    } catch (err) {
      resetVerifier();
      throw err;
    }
  }),

  signOut: wrap(() => auth.signOut()),
};
