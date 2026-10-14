/**
 * Connexion des joueurs par numéro + mot de passe.
 * Firebase Auth gère les comptes e-mail/mot de passe : chaque numéro est
 * converti en une adresse technique unique, jamais montrée au joueur.
 *   +22890123456  <->  22890123456@joueurs.wynveo.app
 * Un numéro ne peut donc avoir qu'un seul compte.
 */
import { ok, fail } from './result.js';

export const AUTH_EMAIL_DOMAIN = 'joueurs.wynveo.app';
export const PASSWORD_MIN_LENGTH = 8;

export function phoneToAuthEmail(e164) {
  return `${String(e164).replace(/\D/g, '')}@${AUTH_EMAIL_DOMAIN}`;
}

/** Renvoie "+22890123456", ou null si l'adresse n'est pas une adresse joueur. */
export function authEmailToPhone(email) {
  const m = String(email ?? '').match(new RegExp(`^(\\d{8,15})@${AUTH_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`));
  return m ? `+${m[1]}` : null;
}

export function validatePassword(password) {
  const pw = String(password ?? '');
  if (pw.length < PASSWORD_MIN_LENGTH) {
    return fail('PASSWORD_SHORT', `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);
  }
  if (!/\d/.test(pw) || !/\p{L}/u.test(pw)) {
    return fail('PASSWORD_WEAK', 'Mélangez des lettres et des chiffres.');
  }
  return ok();
}
