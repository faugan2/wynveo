/**
 * Règles chiffrées de la plateforme. Un seul endroit à modifier :
 * l'application joueur, l'admin et les Cloud Functions lisent ces valeurs.
 * Tous les montants sont des entiers en FCFA.
 */

export const CURRENCY = 'FCFA';

export const DEPOSIT_LIMITS = Object.freeze({
  min: 200,
  max: 1_000_000,
  quickAmounts: [1_000, 5_000, 10_000, 25_000],
});

export const WITHDRAWAL_LIMITS = Object.freeze({
  min: 1_000,
  max: 500_000,
  /** Au-delà de ce total retiré dans la journée, la vérification d'identité est obligatoire. */
  dailyWithoutKyc: 50_000,
  /** En dessous de ce montant, un retrait d'un joueur vérifié part sans validation manuelle. */
  autoApproveMax: 25_000,
  quickAmounts: [5_000, 10_000, 25_000],
});

export const WELCOME_BONUS = Object.freeze({
  /** 1 = 100 % du premier dépôt. */
  rate: 1,
  cap: 10_000,
  /** Le bonus doit être misé N fois avant d'être converti en argent retirable. */
  wagerMultiplier: 5,
});

export const MIN_AGE = 18;

/** Fuseau du Togo : UTC+0, sans heure d'été. Sert au découpage des journées. */
export const TIMEZONE_OFFSET_MINUTES = 0;
