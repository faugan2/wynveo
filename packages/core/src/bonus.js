import { WELCOME_BONUS } from './config.js';

/**
 * Bonus de bienvenue accordé au premier dépôt réussi.
 * Renvoie { amount, wagerRequired } (0 si pas de bonus).
 */
export function computeWelcomeBonus(depositAmount, isFirstDeposit, config = WELCOME_BONUS) {
  if (!isFirstDeposit || depositAmount <= 0) return { amount: 0, wagerRequired: 0 };
  const amount = Math.min(Math.floor(depositAmount * config.rate), config.cap);
  return { amount, wagerRequired: amount * config.wagerMultiplier };
}
