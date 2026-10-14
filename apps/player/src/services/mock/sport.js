/**
 * Sport en mode démo : quelques matchs générés autour de l'heure actuelle,
 * avec les mêmes règles que le serveur (@wynveo/core).
 * Un match commencé passe "en direct" ; le bouton de démo le termine avec un score au hasard.
 */
import {
  SPORTS, MARKET, EVENT_STATUS, SLIP_TYPE, TX_TYPE, TX_STATUS,
  buildTickets, oddsChanges, currentOdds, outcomeLabel, eventName, settleSelection, settleTicket,
  applyStake, applySettlement, applyMargin, makeReference, weakRng,
} from '@wynveo/core';
import { AppError } from '../errors.js';
import { state, commit, subscribe, delay, newId } from './store.js';

const assertRule = (r) => { if (!r.ok) throw new AppError(r.code, r.message); return r; };

/* [sport, compétition, domicile, extérieur, heures après maintenant, cotes brutes 1/N/2 ou 1/2, ligne du total] */
const FIXTURES = [
  ['football', 'Togo D1', 'ASKO Kara', 'Dynamic Togolais', 2, [2.2, 3.0, 3.3], 2.5],
  ['football', 'Togo D1', 'Gomido FC', 'AS OTR Lomé', 3, [2.6, 2.9, 2.7], 2.5],
  ['football', 'Premier League', 'Arsenal', 'Chelsea', 4, [1.95, 3.6, 3.9], 2.5],
  ['football', 'Premier League', 'Liverpool', 'Manchester City', 6, [2.5, 3.6, 2.6], 3.5],
  ['football', 'Ligue 1', 'Paris SG', 'Olympique de Marseille', 27, [1.55, 4.3, 5.5], 2.5],
  ['football', 'LaLiga', 'Real Madrid', 'FC Barcelone', 28, [2.3, 3.7, 2.9], 3.5],
  ['football', 'Ligue des champions', 'Bayern Munich', 'Inter Milan', 50, [1.85, 3.8, 4.0], 2.5],
  ['football', 'Serie A', 'AC Milan', 'Juventus', 52, [2.45, 3.1, 3.0], 2.5],
  ['basketball', 'NBA', 'Boston Celtics', 'Los Angeles Lakers', 8, [1.6, 2.4], 224.5],
  ['basketball', 'NBA', 'Denver Nuggets', 'Golden State Warriors', 31, [1.75, 2.1], 230.5],
  ['tennis', 'ATP Paris', 'C. Alcaraz', 'J. Sinner', 5, [1.9, 1.95], 38.5],
  ['tennis', 'ATP Paris', 'N. Djokovic', 'A. Zverev', 29, [1.7, 2.15], 36.5],
];

function seed(now = new Date()) {
  const events = {};
  for (const [sport, league, home, away, hours, raw, line] of FIXTURES) {
    const startAt = new Date(now.getTime() + hours * 3_600_000);
    startAt.setMinutes(Math.round(startAt.getMinutes() / 15) * 15, 0, 0);
    const h2h = applyMargin(raw);
    const totals = applyMargin([1.9, 1.9]);
    events[newId()] = {
      sport, league, home, away, startAt, status: EVENT_STATUS.SCHEDULED, suspended: false, score: null,
      markets: {
        h2h: SPORTS[sport].hasDraw ? { home: h2h[0], draw: h2h[1], away: h2h[2] } : { home: h2h[0], away: h2h[1] },
        totals: { line, over: totals[0], under: totals[1] },
      },
      betCount: 0, totalStake: 0,
    };
  }
  // Un match qui commence dans 3 minutes, pour voir la fermeture des paris.
  const soon = Object.values(events)[0];
  soon.startAt = new Date(now.getTime() + 3 * 60_000);
  return events;
}

function ensureEvents() {
  const open = Object.values(state.sportEvents ?? {}).filter((e) => e.status === EVENT_STATUS.SCHEDULED && e.startAt > new Date());
  if (open.length < 3) {
    state.sportEvents = { ...Object.fromEntries(Object.entries(state.sportEvents ?? {}).filter(([, e]) => e.status !== EVENT_STATUS.SCHEDULED || state.bets.some((b) => b.eventIds?.includes(e.id)))), ...seed() };
    Object.entries(state.sportEvents).forEach(([id, e]) => { e.id = id; });
    commit();
  }
}

/** Match commencé -> en direct (0-0), comme le ferait l'import des scores. */
function tick(now = new Date()) {
  let changed = false;
  for (const e of Object.values(state.sportEvents ?? {})) {
    if (e.status === EVENT_STATUS.SCHEDULED && e.startAt <= now) { e.status = EVENT_STATUS.LIVE; e.score = { home: 0, away: 0 }; changed = true; }
  }
  if (changed) commit();
}
if (typeof window !== 'undefined') setInterval(() => tick(), 2000);

const view = (id, e) => ({ ...e, id, markets: structuredClone(e.markets) });

function me() {
  if (!state.session) throw new AppError('unauthenticated', 'Connectez-vous pour continuer.');
  const { uid } = state.session;
  if (!state.users[uid]) throw new AppError('PROFILE_MISSING', 'Terminez votre inscription.');
  return uid;
}

function addTx(fields) {
  state.transactions.unshift({ id: newId(), operator: null, msisdn: null, failureReason: null, createdAt: new Date(), updatedAt: new Date(), ...fields });
}

function settleEvent(id) {
  const event = state.sportEvents[id];
  for (const bet of state.bets.filter((b) => b.product === 'sport' && b.status === 'pending' && b.eventIds.includes(id))) {
    bet.selections = bet.selections.map((s) => (s.eventId === id && s.status === 'pending' ? { ...s, status: settleSelection(s, event) } : s));
    const out = settleTicket({ stake: bet.stake, selections: bet.selections });
    if (out.status === 'pending') continue;
    const res = applySettlement(state.wallets[bet.uid], { stake: bet.stake, split: bet.split, win: out.win });
    state.wallets[bet.uid] = res.wallet;
    Object.assign(bet, { status: out.status, win: out.win, finalOdds: out.odds, settledAt: new Date() });
    if (out.win > 0) {
      addTx({
        uid: bet.uid, type: out.status === 'void' ? TX_TYPE.REFUND : TX_TYPE.WIN, status: TX_STATUS.SUCCESS, amount: out.win, product: 'sport',
        reference: bet.reference, label: out.status === 'void' ? 'Pari remboursé (match annulé)' : 'Gain pari sportif', balanceAfter: res.wallet.balance,
      });
    }
    if (res.converted > 0) addTx({ uid: bet.uid, type: TX_TYPE.BONUS_UNLOCK, status: TX_STATUS.SUCCESS, amount: res.converted, reference: bet.reference, label: 'Bonus débloqué : devenu retirable' });
  }
}

export const sportService = {
  watchEvents(cb) {
    ensureEvents();
    tick();
    return subscribe(() => cb(Object.entries(state.sportEvents)
      .filter(([, e]) => [EVENT_STATUS.SCHEDULED, EVENT_STATUS.LIVE].includes(e.status))
      .sort(([, a], [, b]) => a.startAt - b.startAt).map(([id, e]) => view(id, e))));
  },
  watchEvent(id, cb) {
    ensureEvents();
    return subscribe(() => { const e = state.sportEvents[id]; cb(e ? view(id, e) : null); });
  },

  async placeBet({ type, stake, selections = [], acceptOddsChanges }) {
    await delay(450);
    const uid = me();
    const raw = selections.map((s) => ({ eventId: s.eventId, market: s.market, outcome: s.outcome, odds: Number(s.odds) }));
    assertRule(buildTickets({ type, stake, selections: raw }));
    const events = Object.fromEntries(Object.entries(state.sportEvents).map(([id, e]) => [id, { ...e, id }]));
    const changes = oddsChanges(raw, events, new Date());
    if (changes.some((c) => c.closed)) throw new AppError('ODDS_CLOSED', 'Un des matchs de votre coupon n\'est plus disponible.', { code: 'ODDS_CLOSED', changes });
    if (changes.length && !acceptOddsChanges) throw new AppError('ODDS_CHANGED', 'Des cotes ont changé. Vérifiez votre coupon.', { code: 'ODDS_CHANGED', changes });

    const confirmed = raw.map((s) => {
      const e = events[s.eventId];
      const line = s.market === MARKET.TOTALS ? e.markets.totals.line : null;
      return {
        eventId: s.eventId, market: s.market, outcome: s.outcome, line, odds: currentOdds(e, s.market, s.outcome),
        event: eventName(e), league: e.league, sport: e.sport, startAt: e.startAt, pick: outcomeLabel(e, s.market, s.outcome, line), status: 'pending',
      };
    });
    const built = assertRule(buildTickets({ type, stake, selections: confirmed }));
    let wallet = state.wallets[uid];
    const created = [];
    for (const ticket of built.tickets) {
      const staked = assertRule(applyStake(wallet, ticket.stake));
      wallet = staked.wallet;
      created.push({
        id: newId(), uid, product: 'sport', type, stake: ticket.stake, split: staked.split, reference: makeReference('SPT'),
        selections: ticket.selections, eventIds: [...new Set(ticket.selections.map((s) => s.eventId))],
        totalOdds: ticket.totalOdds, potentialWin: ticket.potentialWin, status: 'pending', win: 0, createdAt: new Date(), settledAt: null,
      });
    }
    state.wallets[uid] = wallet;
    for (const bet of created) {
      state.bets.unshift(bet);
      addTx({
        uid, type: TX_TYPE.BET, status: TX_STATUS.SUCCESS, amount: bet.stake, product: 'sport', reference: bet.reference, balanceAfter: wallet.balance,
        label: type === SLIP_TYPE.COMBO ? `Pari combiné (${bet.selections.length})` : `Pari ${bet.selections[0].event}`,
      });
      bet.eventIds.forEach((id) => { state.sportEvents[id].betCount += 1; state.sportEvents[id].totalStake += bet.stake; });
    }
    commit();
    return {
      tickets: created.map((b) => ({ betId: b.id, reference: b.reference, totalOdds: b.totalOdds, potentialWin: b.potentialWin, stake: b.stake })),
      totalStake: built.totalStake, balance: wallet.balance, oddsChanged: changes.length > 0,
    };
  },

  /** Commandes réservées à la démo. */
  demo: {
    /** Termine un match avec un score au hasard et règle les tickets. */
    finishEvent(id) {
      const e = state.sportEvents[id];
      if (!e || [EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED].includes(e.status)) return;
      const max = e.sport === 'football' ? 4 : e.sport === 'tennis' ? 25 : 130;
      const base = e.sport === 'basketball' ? 90 : e.sport === 'tennis' ? 12 : 0;
      let home = base + Math.floor(weakRng() * (max - base + 1));
      let away = base + Math.floor(weakRng() * (max - base + 1));
      if (!SPORTS[e.sport].hasDraw && home === away) home += 1;
      Object.assign(e, { status: EVENT_STATUS.FINISHED, score: { home, away } });
      settleEvent(id);
      commit();
    },
    /** Fait bouger une cote, pour voir l'alerte « les cotes ont changé ». */
    moveOdds(id) {
      const e = state.sportEvents[id];
      if (!e) return;
      e.markets.h2h.home = Math.max(1.05, Math.round((e.markets.h2h.home - 0.15) * 100) / 100);
      commit();
    },
  },
};
