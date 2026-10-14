import { ok, fail } from './result.js';

export const COUNTRY_CODE = '+228';

/** Opérateurs Mobile Money proposés au Togo. */
export const OPERATORS = Object.freeze({
  TMONEY: { id: 'TMONEY', name: 'T-Money', short: 'TMo' },
  FLOOZ: { id: 'FLOOZ', name: 'Flooz (Moov)', short: 'Flz' },
});

export const OPERATOR_IDS = Object.keys(OPERATORS);

/** Préfixes connus, servent seulement à pré-sélectionner l'opérateur. */
const PREFIXES = {
  TMONEY: ['70', '71', '72', '73', '90', '91', '92', '93'],
  FLOOZ: ['78', '79', '96', '97', '98', '99'],
};

/** Garde les 8 chiffres locaux : "+228 90 12 34 56" ou "90123456" -> "90123456". */
export function localDigits(input) {
  let d = String(input ?? '').replace(/\D/g, '');
  if (d.startsWith('00228')) d = d.slice(5);
  else if (d.startsWith('228') && d.length === 11) d = d.slice(3);
  return d;
}

/** Valide un numéro togolais et renvoie sa forme internationale "+22890123456". */
export function normalizeTogoPhone(input) {
  const d = localDigits(input);
  if (d.length !== 8) return fail('PHONE_LENGTH', 'Le numéro doit contenir 8 chiffres.');
  if (!/^[79]/.test(d)) return fail('PHONE_PREFIX', 'Le numéro doit commencer par 7 ou 9.');
  return ok({ e164: `${COUNTRY_CODE}${d}` });
}

/** "+22890123456" -> "+228 90 12 34 56" */
export function formatPhone(e164) {
  const d = localDigits(e164);
  if (d.length !== 8) return String(e164 ?? '');
  return `${COUNTRY_CODE} ${d.replace(/(\d{2})(?=\d)/g, '$1 ')}`;
}

/** "+22890123456" -> "+228 90 •• •• 56" */
export function maskPhone(e164) {
  const d = localDigits(e164);
  if (d.length !== 8) return String(e164 ?? '');
  return `${COUNTRY_CODE} ${d.slice(0, 2)} •• •• ${d.slice(6)}`;
}

/** Devine l'opérateur à partir du préfixe, ou null. */
export function guessOperator(input) {
  const d = localDigits(input);
  const prefix = d.slice(0, 2);
  return OPERATOR_IDS.find((id) => PREFIXES[id].includes(prefix)) ?? null;
}

export function isOperator(id) {
  return OPERATOR_IDS.includes(id);
}
