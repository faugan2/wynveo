import { ok, fail } from './result.js';

export const KYC_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

export const KYC_LABEL = Object.freeze({
  none: 'Identité non vérifiée',
  pending: 'Vérification en cours',
  verified: 'Identité vérifiée',
  rejected: 'Vérification refusée',
});

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
});

/** Nettoie et valide le nom complet saisi à l'inscription. */
export function validateFullName(input) {
  const name = String(input ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 3) return fail('NAME_SHORT', 'Entrez votre nom complet.');
  if (name.length > 60) return fail('NAME_LONG', 'Le nom ne doit pas dépasser 60 caractères.');
  if (!/^[\p{L}][\p{L}' .-]*$/u.test(name)) return fail('NAME_CHARS', 'Le nom ne peut contenir que des lettres.');
  return ok({ value: name });
}

/** Code parrain facultatif : lettres et chiffres, 4 à 16 caractères. */
export function validateReferralCode(input) {
  const code = String(input ?? '').trim().toUpperCase();
  if (!code) return ok({ value: null });
  if (!/^[A-Z0-9]{4,16}$/.test(code)) return fail('REFERRAL_FORMAT', 'Code parrain invalide.');
  return ok({ value: code });
}

/** Code parrain proposé au joueur : prénom + 3 chiffres, ex. "KOSSI482". */
export function makeReferralCode(fullName, random = Math.random) {
  const base = String(fullName).split(' ')[0]
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'WYN';
  return base + String(Math.floor(random() * 1000)).padStart(3, '0');
}

export const PHONE_LABEL = Object.freeze({
  true: 'Numéro vérifié',
  false: 'Numéro à confirmer',
});

/** Initiales pour l'avatar : "Kossi Amouzou" -> "KA". */
export function initials(fullName) {
  return String(fullName ?? '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}
