import { WELCOME_BONUS } from './config.js';

/**
 * Bonus de bienvenue : accordé une seule fois, sur le premier dépôt réussi
 * fait depuis le numéro du compte (ce dépôt prouve que le numéro est au joueur).
 * Renvoie { amount, wagerRequired } (0 si pas de bonus).
 */
export function computeWelcomeBonus(depositAmount, eligible, config = WELCOME_BONUS) {
  if (!eligible || depositAmount <= 0) return { amount: 0, wagerRequired: 0 };
  const amount = Math.min(Math.floor(depositAmount * config.rate), config.cap);
  return { amount, wagerRequired: amount * config.wagerMultiplier };
}
