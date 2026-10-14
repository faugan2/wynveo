import { phoneToAuthEmail, authEmailToPhone } from '@wynveo/core';
import { auth } from '../../config/firebase.js';
import { wrap } from '../errors.js';

/**
 * Comptes joueurs : numéro + mot de passe.
 * Le numéro est converti en adresse technique pour Firebase Auth (voir @wynveo/core/auth).
 */
export const authService = {
  /** cb(user | null), user = { uid, phone } */
  onAuthChange(cb) {
    return auth.onAuthStateChanged((u) => cb(u ? { uid: u.uid, phone: authEmailToPhone(u.email) ?? u.phoneNumber } : null));
  },
  signUp: wrap(async (e164, password) => {
    await auth.createUserWithEmailAndPassword(phoneToAuthEmail(e164), password);
  }),
  signIn: wrap(async (e164, password) => {
    await auth.signInWithEmailAndPassword(phoneToAuthEmail(e164), password);
  }),
  signOut: wrap(() => auth.signOut()),
};
