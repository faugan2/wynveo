import { HttpsError } from 'firebase-functions/v2/https';

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
