import { CURRENCY } from './config.js';

const NBSP = ' ';

/** 25000 -> "25 000" (espaces insécables, pas de décimales). */
export function formatAmount(value) {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '−' : '';
  return sign + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** 25000 -> "25 000 FCFA" */
export function formatFCFA(value) {
  return `${formatAmount(value)}${NBSP}${CURRENCY}`;
}

/** 5000 -> "+5 000", -2000 -> "−2 000" */
export function formatSigned(value) {
  const n = Math.round(Number(value) || 0);
  return (n > 0 ? '+' : '') + formatAmount(n);
}

/**
 * Lit une saisie libre ("5 000", "5000 FCFA", "5.000") et renvoie un entier,
 * ou null si la saisie ne contient pas de chiffres.
 */
export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? Math.trunc(input) : null;
  const digits = String(input ?? '').replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : null;
}

/** Un montant valide est un entier strictement positif. */
export function isValidAmount(value) {
  return Number.isInteger(value) && value > 0;
}
