/**
 * Règles des paris sportifs : cotes, coupon, gains et règlement.
 * Fonctions pures, partagées par l'application, l'admin et les Cloud Functions.
 */
import { ok, fail } from '../result.js';
import { formatFCFA } from '../money.js';
import { SPORTS, MARKET, OUTCOME, EVENT_STATUS, SPORT_LIMITS } from './config.js';

/* ---------------- Cotes ---------------- */

/** Cote arrondie à 2 décimales vers le bas (en faveur de la maison), minimum 1,01. */
export function roundOdds(o) {
  return Math.max(SPORT_LIMITS.minOdds, Math.floor(o * 100 + 1e-9) / 100);
}

/**
 * Applique notre marge à un jeu de cotes (ex. [home, draw, away]).
 * On retire d'abord la marge d'origine (probabilités ramenées à 100 %),
 * puis on applique la nôtre : somme des probabilités = 1 + marge.
 */
export function applyMargin(odds, margin = SPORT_LIMITS.defaultMargin) {
  const implied = odds.map((o) => 1 / o);
  const total = implied.reduce((a, b) => a + b, 0);
  return implied.map((p) => roundOdds(1 / ((p / total) * (1 + margin))));
}

/** Marge réelle d'un jeu de cotes (ex. 0.06 pour 6 %). */
export function marginOf(odds) {
  return odds.reduce((s, o) => s + 1 / o, 0) - 1;
}

export function combinedOdds(odds) {
  return roundOdds(odds.reduce((p, o) => p * o, 1));
}

export function potentialWin(stake, odds, limits = SPORT_LIMITS) {
  return Math.min(Math.floor(stake * odds), limits.maxWin);
}

/* ---------------- Matchs et marchés ---------------- */

export function eventName(e) {
  return `${e.home} – ${e.away}`;
}

/** Les paris sont ouverts jusqu'au coup d'envoi, si le match n'est ni suspendu ni terminé. */
export function isEventOpen(event, now = new Date(), limits = SPORT_LIMITS) {
  const start = new Date(event.startAt).getTime();
  return event.status === EVENT_STATUS.SCHEDULED && !event.suspended
    && start - now.getTime() > limits.closeBeforeStartSeconds * 1000;
}

/** Cote actuelle d'une issue, ou null si le marché est fermé ou absent. */
export function currentOdds(event, market, outcome) {
  const m = event.markets?.[market];
  if (!m || m.suspended) return null;
  const v = m[outcome];
  return typeof v === 'number' && v >= SPORT_LIMITS.minOdds ? v : null;
}

/** Libellé lisible d'un choix : "Arsenal", "Match nul", "Plus de 2.5". */
export function outcomeLabel(event, market, outcome, line = event.markets?.totals?.line) {
  if (market === MARKET.H2H) {
    if (outcome === OUTCOME.HOME) return event.home;
    if (outcome === OUTCOME.AWAY) return event.away;
    return 'Match nul';
  }
  return `${outcome === OUTCOME.OVER ? 'Plus' : 'Moins'} de ${line}`;
}

/** Issues proposées pour un marché, dans l'ordre d'affichage. */
export function marketOutcomes(event, market) {
  if (market === MARKET.TOTALS) return [OUTCOME.OVER, OUTCOME.UNDER];
  return SPORTS[event.sport]?.hasDraw ? [OUTCOME.HOME, OUTCOME.DRAW, OUTCOME.AWAY] : [OUTCOME.HOME, OUTCOME.AWAY];
}

/* ---------------- Coupon ---------------- */

export const SLIP_TYPE = Object.freeze({ SINGLE: 'single', COMBO: 'combo' });

/**
 * Vérifie un coupon et calcule les tickets à créer.
 * - simple : un ticket par sélection, chacun avec la mise indiquée ;
 * - combiné : un seul ticket, cotes multipliées, un seul choix par match.
 * selections : [{ eventId, market, outcome, odds }]
 * Renvoie { tickets: [{ selections, stake, totalOdds, potentialWin }], totalStake }.
 */
export function buildTickets({ type, stake, selections }, limits = SPORT_LIMITS) {
  if (!Array.isArray(selections) || selections.length === 0) return fail('SLIP_EMPTY', 'Ajoutez au moins un choix à votre coupon.');
  if (selections.length > limits.maxSelections) return fail('SLIP_TOO_MANY', `${limits.maxSelections} choix maximum par coupon.`);
  if (!Number.isInteger(stake) || stake < limits.minStake) return fail('STAKE_TOO_LOW', `La mise minimum est de ${formatFCFA(limits.minStake)}.`);
  if (stake > limits.maxStake) return fail('STAKE_TOO_HIGH', `La mise maximum est de ${formatFCFA(limits.maxStake)}.`);
  if (selections.some((s) => !(s.odds >= limits.minOdds))) return fail('ODDS_INVALID', 'Une des cotes est invalide.');

  if (type === SLIP_TYPE.COMBO) {
    if (selections.length < 2) return fail('COMBO_TOO_SMALL', 'Un combiné demande au moins 2 matchs.');
    const ids = selections.map((s) => s.eventId);
    if (new Set(ids).size !== ids.length) return fail('COMBO_SAME_EVENT', 'Un combiné ne peut contenir qu\'un seul choix par match.');
    const totalOdds = combinedOdds(selections.map((s) => s.odds));
    return ok({ totalStake: stake, tickets: [{ selections, stake, totalOdds, potentialWin: potentialWin(stake, totalOdds, limits) }] });
  }
  if (type !== SLIP_TYPE.SINGLE) return fail('SLIP_TYPE', 'Type de coupon inconnu.');
  const tickets = selections.map((s) => ({ selections: [s], stake, totalOdds: roundOdds(s.odds), potentialWin: potentialWin(stake, s.odds, limits) }));
  return ok({ totalStake: stake * tickets.length, tickets });
}

/**
 * Compare les cotes vues par le joueur aux cotes actuelles.
 * Renvoie la liste des choix dont la cote a changé ou qui ne sont plus disponibles.
 */
export function oddsChanges(selections, eventsById, now = new Date()) {
  const changes = [];
  for (const s of selections) {
    const e = eventsById[s.eventId];
    if (!e || !isEventOpen(e, now)) { changes.push({ ...s, closed: true, newOdds: null }); continue; }
    const cur = currentOdds(e, s.market, s.outcome);
    if (cur === null) changes.push({ ...s, closed: true, newOdds: null });
    else if (cur !== s.odds) changes.push({ ...s, closed: false, newOdds: cur });
  }
  return changes;
}

/* ---------------- Règlement ---------------- */

export const SELECTION_STATUS = Object.freeze({ PENDING: 'pending', WON: 'won', LOST: 'lost', VOID: 'void' });

/** Résultat d'un choix une fois le match terminé ou annulé. */
export function settleSelection(sel, event) {
  if (event.status === EVENT_STATUS.CANCELLED) return SELECTION_STATUS.VOID;
  if (event.status !== EVENT_STATUS.FINISHED || !event.score) return SELECTION_STATUS.PENDING;
  const { home, away } = event.score;
  if (sel.market === MARKET.H2H) {
    const winner = home > away ? OUTCOME.HOME : home < away ? OUTCOME.AWAY : OUTCOME.DRAW;
    return sel.outcome === winner ? SELECTION_STATUS.WON : SELECTION_STATUS.LOST;
  }
  if (sel.market === MARKET.TOTALS) {
    const total = home + away;
    if (total === sel.line) return SELECTION_STATUS.VOID;
    const over = total > sel.line;
    return (sel.outcome === OUTCOME.OVER) === over ? SELECTION_STATUS.WON : SELECTION_STATUS.LOST;
  }
  return SELECTION_STATUS.PENDING;
}

/**
 * État d'un ticket à partir de ses choix.
 * - un choix perdu : ticket perdu ;
 * - un choix en attente : en attente ;
 * - sinon gagné, avec les cotes des choix gagnés (un choix annulé compte 1) ;
 * - tous annulés : mise remboursée.
 */
export function settleTicket({ stake, selections }, limits = SPORT_LIMITS) {
  const st = selections.map((s) => s.status);
  if (st.includes(SELECTION_STATUS.LOST)) return { status: 'lost', win: 0, odds: 0 };
  if (st.includes(SELECTION_STATUS.PENDING)) return { status: 'pending', win: 0, odds: null };
  const won = selections.filter((s) => s.status === SELECTION_STATUS.WON);
  if (won.length === 0) return { status: 'void', win: stake, odds: 1 };
  const odds = combinedOdds(won.map((s) => s.odds));
  return { status: 'won', win: potentialWin(stake, odds, limits), odds };
}

/** Le score saisi par l'admin est-il valable ? */
export function validateScore(score) {
  const okNum = (n) => Number.isInteger(n) && n >= 0 && n <= 500;
  return score && okNum(score.home) && okNum(score.away) ? ok() : fail('SCORE_INVALID', 'Entrez un score valide.');
}
