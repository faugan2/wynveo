/**
 * Mises et gains sur le portefeuille (communs aux jeux et, plus tard, au sport).
 *
 * - La mise est prise d'abord sur l'argent réel, puis sur le bonus.
 * - Le gain revient dans la même proportion : la part payée avec le bonus
 *   regagne du bonus, la part payée en argent réel regagne de l'argent réel.
 *   Impossible donc de retirer un bonus sans l'avoir joué.
 * - Chaque mise fait baisser le montant restant à miser pour débloquer le bonus.
 *   À zéro, le bonus restant devient de l'argent réel (retirable).
 */
import { ok, fail } from '../result.js';

export function splitStake(wallet, stake) {
  const real = Math.max(0, wallet.balance ?? 0);
  const bonus = Math.max(0, wallet.bonusBalance ?? 0);
  if (stake > real + bonus) return fail('INSUFFICIENT_FUNDS', 'Solde insuffisant pour cette mise. Faites un dépôt.');
  const fromReal = Math.min(real, stake);
  return ok({ fromReal, fromBonus: stake - fromReal });
}

/** Débite la mise. Renvoie { wallet, split } ou lève l'échec de splitStake. */
export function applyStake(wallet, stake) {
  const res = splitStake(wallet, stake);
  if (!res.ok) return res;
  const split = { fromReal: res.fromReal, fromBonus: res.fromBonus };
  const next = {
    ...wallet,
    balance: wallet.balance - split.fromReal,
    bonusBalance: (wallet.bonusBalance ?? 0) - split.fromBonus,
    bonusWagerRemaining: Math.max(0, (wallet.bonusWagerRemaining ?? 0) - stake),
    totalStaked: (wallet.totalStaked ?? 0) + stake,
  };
  return ok({ wallet: next, split });
}

/** Partage un gain selon la provenance de la mise. */
export function splitWin(win, stake, split) {
  if (win <= 0 || stake <= 0) return { toReal: 0, toBonus: 0 };
  const toBonus = Math.floor((win * split.fromBonus) / stake);
  return { toReal: win - toBonus, toBonus };
}

/**
 * Crédite le gain d'une mise réglée puis, si les conditions sont remplies,
 * convertit le bonus en argent réel. Renvoie { wallet, credited, converted }.
 */
export function applySettlement(wallet, { stake, split, win }) {
  const credited = splitWin(win, stake, split);
  let next = {
    ...wallet,
    balance: wallet.balance + credited.toReal,
    bonusBalance: (wallet.bonusBalance ?? 0) + credited.toBonus,
    totalWon: (wallet.totalWon ?? 0) + win,
  };
  const res = convertBonusIfUnlocked(next);
  next = res.wallet;
  return { wallet: next, credited, converted: res.converted };
}

/** Bonus entièrement misé : il devient de l'argent réel. Plus de bonus : plus rien à miser. */
export function convertBonusIfUnlocked(wallet) {
  const bonus = wallet.bonusBalance ?? 0;
  if (bonus <= 0) return { wallet: { ...wallet, bonusBalance: 0, bonusWagerRemaining: 0 }, converted: 0 };
  if ((wallet.bonusWagerRemaining ?? 0) > 0) return { wallet, converted: 0 };
  return { wallet: { ...wallet, balance: wallet.balance + bonus, bonusBalance: 0, bonusWagerRemaining: 0 }, converted: bonus };
}
