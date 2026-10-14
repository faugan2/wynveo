/**
 * Règles des jeux : validation des mises, tirages et calcul des gains.
 * Fonctions pures, le hasard est injecté (voir ../random.js).
 */
import { ok, fail } from '../result.js';
import { formatFCFA } from '../money.js';
import { pickWeighted, drawDistinct } from '../random.js';
import { LUCKY_SPIN, MYSTERY_BOX, LUCKY_NUMBER, JACKPOT } from './config.js';

/** Gain arrondi à l'entier inférieur (pas de centimes en FCFA). */
export const winAmount = (stake, multiplier) => Math.floor(stake * multiplier);

export function validateStake(stake, { minStake, maxStake }) {
  if (!Number.isInteger(stake) || stake <= 0) return fail('STAKE_INVALID', 'Choisissez une mise.');
  if (stake < minStake) return fail('STAKE_TOO_LOW', `La mise minimum est de ${formatFCFA(minStake)}.`);
  if (stake > maxStake) return fail('STAKE_TOO_HIGH', `La mise maximum est de ${formatFCFA(maxStake)}.`);
  return ok();
}

/** Taux de retour théorique d'une table { multiplier, weight }. */
export function expectedReturn(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  return entries.reduce((s, e) => s + e.multiplier * e.weight, 0) / total;
}

/* ---------------- Lucky Spin ---------------- */

export function spinWheel(rng, config = LUCKY_SPIN) {
  const index = pickWeighted(config.segments.map((s) => s.weight), rng);
  return { segmentIndex: index, multiplier: config.segments[index].multiplier };
}

/* ---------------- Mystery Box ---------------- */

export function validateBoxChoice(box, config = MYSTERY_BOX) {
  return Number.isInteger(box) && box >= 0 && box < config.boxCount
    ? ok() : fail('BOX_INVALID', 'Choisissez une boîte.');
}

/** Contenu des 9 coffres, tiré avant l'ouverture ; le gain est celui du coffre choisi. */
export function openBoxes(chosen, rng, config = MYSTERY_BOX) {
  const weights = config.prizes.map((p) => p.weight);
  const boxes = Array.from({ length: config.boxCount }, () => config.prizes[pickWeighted(weights, rng)].multiplier);
  return { boxes, multiplier: boxes[chosen] };
}

/* ---------------- Lucky Number ---------------- */

export function validateNumbers(numbers, config = LUCKY_NUMBER) {
  if (!Array.isArray(numbers) || numbers.length !== config.pick) {
    return fail('NUMBERS_COUNT', `Choisissez exactement ${config.pick} numéros.`);
  }
  const valid = numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= config.maxNumber);
  if (!valid || new Set(numbers).size !== numbers.length) {
    return fail('NUMBERS_INVALID', `Choisissez ${config.pick} numéros différents entre 1 et ${config.maxNumber}.`);
  }
  return ok({ value: [...numbers].sort((a, b) => a - b) });
}

/** Identifiant et heure du prochain tirage (créneaux de 15 min alignés sur l'heure). */
export function nextDrawSlot(now = new Date(), config = LUCKY_NUMBER) {
  const step = config.intervalMinutes * 60_000;
  const drawAt = new Date(Math.floor(now.getTime() / step) * step + step);
  return { drawId: `LN-${drawAt.toISOString().slice(0, 16).replace(/[-:T]/g, '')}`, drawAt };
}

/** Le tirage est-il encore ouvert aux tickets ? */
export function isDrawOpen(drawAt, now = new Date(), config = LUCKY_NUMBER) {
  return drawAt.getTime() - now.getTime() > config.closeBeforeSeconds * 1000;
}

/** Ticket du prochain tirage encore ouvert (passe au suivant si trop tard). */
export function ticketDrawSlot(now = new Date(), config = LUCKY_NUMBER) {
  const slot = nextDrawSlot(now, config);
  if (isDrawOpen(slot.drawAt, now, config)) return slot;
  return nextDrawSlot(new Date(slot.drawAt.getTime() + 1000), config);
}

export function drawNumbers(rng, config = LUCKY_NUMBER) {
  return drawDistinct(config.pick, config.maxNumber, rng);
}

export function countMatches(picked, drawn) {
  const set = new Set(drawn);
  return picked.filter((n) => set.has(n)).length;
}

export function luckyNumberWin(stake, matches, config = LUCKY_NUMBER) {
  const mult = config.payTable[matches] ?? 0;
  return { multiplier: mult, win: Math.min(winAmount(stake, mult), config.maxWin) };
}

/** Probabilité exacte d'avoir k bons numéros (loi hypergéométrique). */
export function luckyNumberOdds(k, config = LUCKY_NUMBER) {
  const C = (n, r) => { let x = 1; for (let i = 0; i < r; i += 1) x = (x * (n - i)) / (i + 1); return x; };
  const { pick, maxNumber } = config;
  return (C(pick, k) * C(maxNumber - pick, pick - k)) / C(maxNumber, pick);
}

export function luckyNumberRtp(config = LUCKY_NUMBER) {
  return Object.entries(config.payTable).reduce((s, [k, m]) => s + luckyNumberOdds(Number(k), config) * m, 0);
}

/* ---------------- Jackpot ---------------- */

export function validateTicketCount(tickets, config = JACKPOT) {
  if (!Number.isInteger(tickets) || tickets < 1) return fail('TICKETS_INVALID', 'Choisissez au moins un ticket.');
  if (tickets > config.maxTicketsPerPurchase) return fail('TICKETS_TOO_MANY', `${config.maxTicketsPerPurchase} tickets maximum par achat.`);
  return ok({ stake: tickets * config.ticketPrice });
}

/** Tirage du jour : "JP-20261014" et son heure. Après 20:00, on passe au lendemain. */
export function jackpotRoundFor(now = new Date(), config = JACKPOT) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), config.drawHourUtc));
  if (now.getTime() >= d.getTime() - 60_000) d.setUTCDate(d.getUTCDate() + 1);
  return { roundId: `JP-${d.toISOString().slice(0, 10).replace(/-/g, '')}`, drawAt: d };
}

export function jackpotPoolAfter(pool, stake, config = JACKPOT) {
  return pool + Math.floor(stake * config.poolShare);
}

/**
 * Désigne le ticket gagnant parmi les achats [{ id, uid, tickets }].
 * Chaque ticket a la même chance. Renvoie { purchase, ticketNumber } ou null.
 */
export function pickJackpotWinner(purchases, rng) {
  const total = purchases.reduce((s, p) => s + p.tickets, 0);
  if (total === 0) return null;
  const ticketNumber = rng(total);
  let r = ticketNumber;
  for (const p of purchases) {
    if (r < p.tickets) return { purchase: p, ticketNumber: ticketNumber + 1, totalTickets: total };
    r -= p.tickets;
  }
  return null;
}

/* ---------------- Résultat d'un pari (affichage) ---------------- */

/** 'pending' | 'won' (gain > mise) | 'refunded' (gain = mise) | 'partial' (0 < gain < mise) | 'lost' */
export function betResult({ status, stake, win }) {
  if (status === 'pending') return 'pending';
  if (win > stake) return 'won';
  if (win === stake) return 'refunded';
  if (win > 0) return 'partial';
  return 'lost';
}

export const BET_RESULT = Object.freeze({
  pending: { label: 'En cours', tone: 'warn' },
  won: { label: 'Gagné', tone: 'good' },
  refunded: { label: 'Remboursé', tone: 'info' },
  partial: { label: 'Remboursé en partie', tone: 'info' },
  lost: { label: 'Perdu', tone: 'bad' },
});
