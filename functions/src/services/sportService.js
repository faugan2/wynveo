/**
 * Paris sportifs : placement des tickets, règlement des matchs, gestion par l'admin.
 * Toutes les opérations d'argent se font dans des transactions Firestore.
 */
import { HttpsError } from 'firebase-functions/v2/https';
import { db, COL, FieldValue } from '../lib/firebase.js';
import { assertRule, badRequest } from '../lib/guards.js';
import {
  walletRef, newTxRef, newBetRef, betRef, sportEventRef, newSportEventRef, walletFromDoc, walletUpdate, newTransaction, logAdminAction,
} from '../repositories/index.js';
import { getActivePlayer } from './profileService.js';
import {
  SPORTS, MARKET, EVENT_STATUS, SLIP_TYPE, TX_TYPE, TX_STATUS,
  buildTickets, oddsChanges, currentOdds, outcomeLabel, eventName, settleSelection, settleTicket, validateScore,
  applyStake, applySettlement, makeReference, dayKey, roundOdds,
} from '../core/index.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);
const eventFromSnap = (snap) => ({ id: snap.id, ...snap.data(), startAt: toDate(snap.data().startAt) });

/* ---------------- Placement d'un coupon ---------------- */

/**
 * input : { type: 'single'|'combo', stake, selections: [{ eventId, market, outcome, odds }], acceptOddsChanges }
 * Les cotes envoyées sont celles que le joueur a vues ; si elles ont changé entre-temps,
 * le pari est refusé (avec les nouvelles cotes) sauf si acceptOddsChanges est vrai.
 */
export async function placeSportBet(uid, input = {}, now = new Date()) {
  const { type, stake, acceptOddsChanges } = input;
  const raw = (input.selections ?? []).map((s) => ({ eventId: String(s.eventId ?? ''), market: s.market, outcome: s.outcome, odds: Number(s.odds) }));
  assertRule(buildTickets({ type, stake, selections: raw }));

  return db.runTransaction(async (t) => {
    await getActivePlayer(uid, t);
    const ids = [...new Set(raw.map((s) => s.eventId))];
    const [wSnap, ...eventSnaps] = await Promise.all([t.get(walletRef(uid)), ...ids.map((id) => t.get(sportEventRef(id)))]);
    const events = Object.fromEntries(eventSnaps.filter((e) => e.exists).map((e) => [e.id, eventFromSnap(e)]));

    const changes = oddsChanges(raw, events, now);
    if (changes.some((c) => c.closed)) {
      throw new HttpsError('failed-precondition', 'Un des matchs de votre coupon n\'est plus disponible.', { code: 'ODDS_CLOSED', changes });
    }
    if (changes.length && !acceptOddsChanges) {
      throw new HttpsError('failed-precondition', 'Des cotes ont changé. Vérifiez votre coupon.', { code: 'ODDS_CHANGED', changes });
    }

    // Cotes confirmées + photo du match au moment du pari (le libellé ne bouge plus ensuite).
    const confirmed = raw.map((s) => {
      const e = events[s.eventId];
      const line = s.market === MARKET.TOTALS ? e.markets.totals.line : null;
      return {
        eventId: s.eventId, market: s.market, outcome: s.outcome, line, odds: currentOdds(e, s.market, s.outcome),
        event: eventName(e), league: e.league, sport: e.sport, startAt: e.startAt,
        pick: outcomeLabel(e, s.market, s.outcome, line), status: 'pending',
      };
    });
    const built = assertRule(buildTickets({ type, stake, selections: confirmed }));

    let wallet = walletFromDoc(wSnap);
    const out = [];
    for (const ticket of built.tickets) {
      const staked = assertRule(applyStake(wallet, ticket.stake));
      wallet = staked.wallet;
      const ref = newBetRef();
      const reference = makeReference('SPT');
      t.set(ref, {
        uid, product: 'sport', type, stake: ticket.stake, split: staked.split, reference,
        selections: ticket.selections, eventIds: [...new Set(ticket.selections.map((s) => s.eventId))],
        totalOdds: ticket.totalOdds, potentialWin: ticket.potentialWin,
        status: 'pending', win: 0, createdAt: FieldValue.serverTimestamp(), settledAt: null,
      });
      t.set(newTxRef(), newTransaction({
        uid, type: TX_TYPE.BET, status: TX_STATUS.SUCCESS, amount: ticket.stake, product: 'sport', betId: ref.id, reference,
        label: type === SLIP_TYPE.COMBO ? `Pari combiné (${ticket.selections.length})` : `Pari ${ticket.selections[0].event}`,
        dayKey: dayKey(now), balanceAfter: wallet.balance,
      }));
      out.push({ betId: ref.id, reference, totalOdds: ticket.totalOdds, potentialWin: ticket.potentialWin, stake: ticket.stake });
    }
    t.set(wSnap.ref, walletUpdate(wallet), { merge: true });

    // Exposition par match, utile à l'admin.
    for (const id of ids) {
      const e = events[id];
      const n = built.tickets.filter((tk) => tk.selections.some((s) => s.eventId === id));
      t.update(sportEventRef(id), {
        betCount: (e.betCount ?? 0) + n.length,
        totalStake: (e.totalStake ?? 0) + n.reduce((sum, tk) => sum + tk.stake, 0),
      });
    }
    return { tickets: out, totalStake: built.totalStake, balance: wallet.balance, oddsChanged: changes.length > 0 };
  });
}

/* ---------------- Règlement ---------------- */

/** Règle tous les tickets en attente qui contiennent ce match (terminé ou annulé). Rejouable sans risque. */
export async function settleSportEvent(eventId) {
  const eSnap = await sportEventRef(eventId).get();
  if (!eSnap.exists) throw new HttpsError('not-found', 'Match introuvable.');
  const event = eventFromSnap(eSnap);
  if (![EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED].includes(event.status)) return { settled: 0 };

  const pending = await db.collection(COL.BETS).where('eventIds', 'array-contains', eventId).where('status', '==', 'pending').get();
  let settled = 0;
  let paid = 0;
  for (const doc of pending.docs) {
    const res = await db.runTransaction(async (t) => {
      const bSnap = await t.get(doc.ref);
      const bet = bSnap.data();
      if (bet.status !== 'pending') return null;
      const wSnap = await t.get(walletRef(bet.uid));
      const selections = bet.selections.map((s) => (s.eventId === eventId && s.status === 'pending' ? { ...s, status: settleSelection(s, event) } : s));
      const outcome = settleTicket({ stake: bet.stake, selections });
      if (outcome.status === 'pending') {
        t.update(doc.ref, { selections });
        return null;
      }
      const result = applySettlement(walletFromDoc(wSnap), { stake: bet.stake, split: bet.split, win: outcome.win });
      t.set(wSnap.ref, walletUpdate(result.wallet), { merge: true });
      t.update(doc.ref, { selections, status: outcome.status, win: outcome.win, finalOdds: outcome.odds, settledAt: FieldValue.serverTimestamp() });
      if (outcome.win > 0) {
        t.set(newTxRef(), newTransaction({
          uid: bet.uid, type: outcome.status === 'void' ? TX_TYPE.REFUND : TX_TYPE.WIN, status: TX_STATUS.SUCCESS, amount: outcome.win,
          product: 'sport', betId: doc.id, reference: bet.reference, dayKey: dayKey(),
          label: outcome.status === 'void' ? 'Pari remboursé (match annulé)' : 'Gain pari sportif', balanceAfter: result.wallet.balance,
        }));
      }
      if (result.converted > 0) {
        t.set(newTxRef(), newTransaction({
          uid: bet.uid, type: TX_TYPE.BONUS_UNLOCK, status: TX_STATUS.SUCCESS, amount: result.converted, dayKey: dayKey(),
          reference: bet.reference, label: 'Bonus débloqué : devenu retirable', balanceAfter: result.wallet.balance,
        }));
      }
      return outcome.win;
    });
    if (res !== null) { settled += 1; paid += res; }
  }
  await sportEventRef(eventId).update({ settledAt: FieldValue.serverTimestamp(), settledTickets: (event.settledTickets ?? 0) + settled, paidOut: (event.paidOut ?? 0) + paid });
  return { settled, paid };
}

/* ---------------- Admin ---------------- */

function cleanOdds(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1.01 ? roundOdds(n) : null;
}

/** Crée ou modifie un match et ses cotes (saisie manuelle par l'admin). */
export async function upsertSportEvent(admin, data = {}) {
  const sport = SPORTS[data.sport];
  if (!sport) throw badRequest('Choisissez un sport.');
  const league = String(data.league ?? '').trim();
  const home = String(data.home ?? '').trim();
  const away = String(data.away ?? '').trim();
  const startAt = new Date(data.startAt);
  if (!league || !home || !away) throw badRequest('Indiquez la compétition et les deux équipes.');
  if (home.toLowerCase() === away.toLowerCase()) throw badRequest('Les deux équipes doivent être différentes.');
  if (Number.isNaN(startAt.getTime())) throw badRequest('Date du match invalide.');
  const h = data.markets?.h2h ?? {};
  const h2h = { home: cleanOdds(h.home), away: cleanOdds(h.away), suspended: Boolean(h.suspended) };
  if (sport.hasDraw) h2h.draw = cleanOdds(h.draw);
  if (!h2h.home || !h2h.away || (sport.hasDraw && !h2h.draw)) throw badRequest('Toutes les cotes du résultat doivent être supérieures à 1,01.');
  const markets = { h2h };
  const tt = data.markets?.totals;
  if (tt && (tt.over || tt.under)) {
    const line = Number(tt.line);
    const over = cleanOdds(tt.over);
    const under = cleanOdds(tt.under);
    if (!(line > 0) || !over || !under) throw badRequest('Le total doit avoir une ligne et deux cotes valides.');
    markets.totals = { line, over, under, suspended: Boolean(tt.suspended) };
  }

  const ref = data.id ? sportEventRef(data.id) : newSportEventRef();
  return db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (snap.exists && [EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED].includes(snap.data().status)) {
      throw new HttpsError('failed-precondition', 'Ce match est terminé : il ne peut plus être modifié.');
    }
    const base = snap.exists ? snap.data() : { status: EVENT_STATUS.SCHEDULED, suspended: false, score: null, betCount: 0, totalStake: 0, source: 'manual', externalId: null, createdAt: FieldValue.serverTimestamp() };
    t.set(ref, { ...base, sport: sport.id, league, home, away, startAt, markets, manualOdds: true, updatedAt: FieldValue.serverTimestamp() });
    logAdminAction(t, { adminUid: admin.uid, adminEmail: admin.email, action: snap.exists ? 'sport.event.update' : 'sport.event.create', target: { type: 'sportEvent', id: ref.id }, details: { home, away, markets } });
    return { id: ref.id };
  });
}

export async function setSportEventSuspended(admin, { eventId, suspended }) {
  await db.runTransaction(async (t) => {
    const snap = await t.get(sportEventRef(eventId));
    if (!snap.exists) throw new HttpsError('not-found', 'Match introuvable.');
    t.update(snap.ref, { suspended: Boolean(suspended), updatedAt: FieldValue.serverTimestamp() });
    logAdminAction(t, { adminUid: admin.uid, adminEmail: admin.email, action: suspended ? 'sport.event.suspend' : 'sport.event.resume', target: { type: 'sportEvent', id: eventId } });
  });
  return { ok: true };
}

/** Saisie du résultat final (ou annulation), puis règlement automatique des tickets. */
export async function setSportEventResult(admin, { eventId, score, cancelled }) {
  if (!cancelled) assertRule(validateScore(score));
  await db.runTransaction(async (t) => {
    const snap = await t.get(sportEventRef(eventId));
    if (!snap.exists) throw new HttpsError('not-found', 'Match introuvable.');
    const e = snap.data();
    if ([EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED].includes(e.status)) throw new HttpsError('failed-precondition', 'Le résultat de ce match est déjà enregistré.');
    t.update(snap.ref, {
      status: cancelled ? EVENT_STATUS.CANCELLED : EVENT_STATUS.FINISHED, score: cancelled ? null : score,
      resultBy: admin ? { uid: admin.uid, email: admin.email } : { system: 'odds_api' }, updatedAt: FieldValue.serverTimestamp(),
    });
    if (admin) logAdminAction(t, { adminUid: admin.uid, adminEmail: admin.email, action: cancelled ? 'sport.event.cancel' : 'sport.event.result', target: { type: 'sportEvent', id: eventId }, details: { score: score ?? null } });
  });
  return settleSportEvent(eventId);
}
