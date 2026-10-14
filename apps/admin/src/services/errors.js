/**
 * Erreur unique remontée par tous les services : { code, message }.
 * Les écrans affichent `message` sans jamais connaître Firebase.
 */
export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const AUTH_MESSAGES = {
  'auth/invalid-phone-number': 'Ce numéro de téléphone est invalide.',
  'auth/invalid-verification-code': 'Code incorrect. Vérifiez le SMS et réessayez.',
  'auth/code-expired': 'Ce code a expiré. Demandez-en un nouveau.',
  'auth/too-many-requests': 'Trop de tentatives. Patientez quelques minutes.',
  'auth/quota-exceeded': "Trop de SMS envoyés aujourd'hui. Réessayez plus tard.",
  'auth/network-request-failed': 'Pas de connexion internet.',
  'auth/captcha-check-failed': 'La vérification anti-robot a échoué. Rechargez la page.',
};

export function toAppError(err) {
  if (err instanceof AppError) return err;
  const code = err?.details?.code || err?.code || 'UNKNOWN';
  if (AUTH_MESSAGES[code]) return new AppError(code, AUTH_MESSAGES[code]);
  if (code === 'functions/unavailable' || code === 'unavailable') {
    return new AppError(code, 'Service momentanément indisponible. Réessayez.');
  }
  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return new AppError(code, err?.message || "Vous n'avez pas accès à cette information.");
  }
  // Les erreurs des Cloud Functions portent déjà un message en français.
  if (String(code).startsWith('functions/') || err?.details?.code) {
    return new AppError(err?.details?.code || code, err.message);
  }
  return new AppError(code, 'Une erreur est survenue. Réessayez.');
}

/** Enveloppe une fonction async pour convertir ses erreurs en AppError. */
export const wrap = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    throw toAppError(err);
  }
};
