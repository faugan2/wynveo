/**
 * Format de retour commun des règles métier.
 * { ok: true } ou { ok: false, code, message }
 * Le code est stable (pour le code), le message est destiné au joueur.
 */
export const ok = (extra = {}) => ({ ok: true, ...extra });
export const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });
