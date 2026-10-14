import { HttpsError } from 'firebase-functions/v2/https';
import { authEmailToPhone } from '../core/index.js';

/** Rôles du back-office (custom claim `role`). */
export const ROLES = Object.freeze({
  SUPER: 'super',
  FINANCE: 'finance',
  SUPPORT: 'support',
  TRADER: 'trader',
});

export function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connectez-vous pour continuer.');
  return request.auth;
}

export function requireRole(request, allowed) {
  const auth = requireAuth(request);
  const role = auth.token.role;
  if (!role || !allowed.includes(role)) {
    throw new HttpsError('permission-denied', "Vous n'avez pas les droits pour cette action.");
  }
  return { uid: auth.uid, role, email: auth.token.email ?? null };
}

/** Transforme un échec de règle métier (core) en erreur lisible côté client. */
export function assertRule(result) {
  if (!result.ok) throw new HttpsError('failed-precondition', result.message, { code: result.code });
  return result;
}

export function badRequest(message, code = 'INVALID_ARGUMENT') {
  return new HttpsError('invalid-argument', message, { code });
}

/**
 * Numéro du joueur, lu dans son jeton de connexion (jamais envoyé par le navigateur).
 * - compte numéro + mot de passe : déduit de l'adresse technique, à confirmer par un dépôt ;
 * - compte connecté par SMS : déjà vérifié par Firebase.
 */
export function playerPhone(token) {
  if (token.phone_number) return { phone: token.phone_number, verified: true };
  const phone = authEmailToPhone(token.email);
  if (!phone) throw new HttpsError('permission-denied', 'Ce compte n\'est pas un compte joueur.');
  return { phone, verified: false };
}
