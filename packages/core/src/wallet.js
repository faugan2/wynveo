/**
 * Règles du portefeuille. Fonctions pures : elles reçoivent un état et
 * renvoient le nouvel état. Les Cloud Functions s'occupent de l'enregistrer
 * dans une transaction Firestore ; l'application les utilise pour valider
 * les formulaires avant d'appeler le serveur.
 */
import { DEPOSIT_LIMITS, WITHDRAWAL_LIMITS, WELCOME_BONUS } from './config.js';
import { ok, fail } from './result.js';
import { isValidAmount, formatFCFA } from './money.js';
import { currentDailyCounter } from './dates.js';
import { computeWelcomeBonus } from './bonus.js';
import { KYC_STATUS } from './profile.js';

/** Portefeuille d'un nouveau joueur. */
export function createEmptyWallet() {
  return {
    balance: 0,
    bonusBalance: 0,
    bonusWagerRemaining: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    depositCount: 0,
    withdrawnToday: { date: null, amount: 0 },
  };
}

/** Argent réellement retirable (le bonus ne l'est pas). */
export function withdrawableAmount(wallet) {
  return Math.max(0, wallet?.balance ?? 0);
}

/** Total affiché au joueur : argent réel + bonus. */
export function displayBalance(wallet) {
  return (wallet?.balance ?? 0) + (wallet?.bonusBalance ?? 0);
}

export function validateDepositAmount(amount, limits = DEPOSIT_LIMITS) {
  if (!isValidAmount(amount)) return fail('AMOUNT_INVALID', 'Entrez un montant.');
  if (amount < limits.min) return fail('AMOUNT_TOO_LOW', `Le dépôt minimum est de ${formatFCFA(limits.min)}.`);
  if (amount > limits.max) return fail('AMOUNT_TOO_HIGH', `Le dépôt maximum est de ${formatFCFA(limits.max)}.`);
  return ok();
}

/**
 * Vérifie une demande de retrait.
 * @param {object} p
 * @param {number} p.amount
 * @param {object} p.wallet
 * @param {string} p.kycStatus
 * @param {string} p.today  clé de journée (dayKey)
 */
export function validateWithdrawal({ amount, wallet, kycStatus, today }, limits = WITHDRAWAL_LIMITS) {
  if (!isValidAmount(amount)) return fail('AMOUNT_INVALID', 'Entrez un montant.');
  if (amount < limits.min) return fail('AMOUNT_TOO_LOW', `Le retrait minimum est de ${formatFCFA(limits.min)}.`);
  if (amount > limits.max) return fail('AMOUNT_TOO_HIGH', `Le retrait maximum est de ${formatFCFA(limits.max)} par opération.`);
  if (amount > withdrawableAmount(wallet)) return fail('INSUFFICIENT_FUNDS', 'Votre solde retirable est insuffisant.');
  const daily = currentDailyCounter(wallet?.withdrawnToday, today);
  if (kycStatus !== KYC_STATUS.VERIFIED && daily.amount + amount > limits.dailyWithoutKyc) {
    return fail('KYC_REQUIRED', `Au-delà de ${formatFCFA(limits.dailyWithoutKyc)} par jour, vérifiez d'abord votre identité.`);
  }
  return ok();
}

/** 'auto' : envoi immédiat ; 'manual' : un admin doit valider. */
export function withdrawalReviewMode({ amount, kycStatus }, limits = WITHDRAWAL_LIMITS) {
  return kycStatus === KYC_STATUS.VERIFIED && amount <= limits.autoApproveMax ? 'auto' : 'manual';
}

/**
 * Dépôt confirmé par l'opérateur : crédite le solde et, au premier dépôt,
 * le bonus de bienvenue. Renvoie { wallet, bonus }.
 */
export function applyDeposit(wallet, amount, bonusConfig = WELCOME_BONUS) {
  const isFirst = (wallet.depositCount ?? 0) === 0;
  const bonus = computeWelcomeBonus(amount, isFirst, bonusConfig);
  return {
    bonus,
    wallet: {
      ...wallet,
      balance: wallet.balance + amount,
      bonusBalance: (wallet.bonusBalance ?? 0) + bonus.amount,
      bonusWagerRemaining: (wallet.bonusWagerRemaining ?? 0) + bonus.wagerRequired,
      totalDeposited: (wallet.totalDeposited ?? 0) + amount,
      depositCount: (wallet.depositCount ?? 0) + 1,
    },
  };
}

/** Demande de retrait : l'argent est retiré du solde tout de suite (mis de côté). */
export function applyWithdrawalHold(wallet, amount, today) {
  const daily = currentDailyCounter(wallet.withdrawnToday, today);
  return {
    ...wallet,
    balance: wallet.balance - amount,
    withdrawnToday: { date: today, amount: daily.amount + amount },
  };
}

/** Retrait refusé ou échoué : l'argent revient au joueur. */
export function applyWithdrawalRefund(wallet, amount, requestDay, today) {
  const daily = currentDailyCounter(wallet.withdrawnToday, today);
  const sameDay = requestDay === today;
  return {
    ...wallet,
    balance: wallet.balance + amount,
    withdrawnToday: sameDay ? { date: today, amount: Math.max(0, daily.amount - amount) } : daily,
  };
}

/** Retrait payé par l'opérateur : met à jour le cumul. */
export function applyWithdrawalPaid(wallet, amount) {
  return { ...wallet, totalWithdrawn: (wallet.totalWithdrawn ?? 0) + amount };
}
