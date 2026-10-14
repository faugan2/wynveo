import { LUCKY_NUMBER, JACKPOT } from '@wynveo/core';
import { db, functions } from '../../config/firebase.js';
import { wrap, toAppError } from '../errors.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);
const call = (name) => async (data) => (await functions.httpsCallable(name)(data)).data;

export function mapBet(doc) {
  const d = doc.data();
  return {
    id: doc.id, game: d.game, product: d.product, stake: d.stake, status: d.status, multiplier: d.multiplier,
    win: d.win ?? 0, reference: d.reference, outcome: d.outcome ?? null, numbers: d.numbers ?? null,
    drawId: d.drawId ?? null, drawAt: toDate(d.drawAt), tickets: d.tickets ?? null, roundId: d.roundId ?? null,
    createdAt: toDate(d.createdAt) ?? new Date(), settledAt: toDate(d.settledAt),
    // Paris sportifs
    type: d.type ?? null, totalOdds: d.totalOdds ?? null, potentialWin: d.potentialWin ?? null, finalOdds: d.finalOdds ?? null,
    selections: (d.selections ?? null)?.map((x) => ({ ...x, startAt: toDate(x.startAt) })) ?? null,
  };
}

const mapDraw = (doc) => ({ id: doc.id, ...doc.data(), drawAt: toDate(doc.data().drawAt) });

/** Jeux : les tirages sont faits par les Cloud Functions, ici on ne fait qu'appeler et écouter. */
export const gamesService = {
  config: { luckyNumber: LUCKY_NUMBER, jackpot: JACKPOT },
  demo: null,

  playSpin: wrap(call('gamesPlaySpin')),
  playBox: wrap(call('gamesPlayBox')),
  buyNumbers: wrap(call('gamesBuyNumbers')),
  buyJackpot: wrap(call('gamesBuyJackpot')),

  watchBets(uid, { limit = 50 } = {}, cb, onError) {
    return db.collection('bets').where('uid', '==', uid).orderBy('createdAt', 'desc').limit(limit)
      .onSnapshot((s) => cb(s.docs.map(mapBet)), (e) => onError?.(toAppError(e)));
  },
  watchMyTickets(uid, drawId, cb, onError) {
    return db.collection('bets').where('uid', '==', uid).where('drawId', '==', drawId)
      .onSnapshot((s) => cb(s.docs.map(mapBet)), (e) => onError?.(toAppError(e)));
  },
  watchRecentDraws(cb, onError, limit = 5) {
    return db.collection('lnDraws').where('status', '==', 'drawn').orderBy('drawAt', 'desc').limit(limit)
      .onSnapshot((s) => cb(s.docs.map(mapDraw)), (e) => onError?.(toAppError(e)));
  },
  watchJackpotRound(roundId, cb, onError) {
    return db.collection('jackpotRounds').doc(roundId)
      .onSnapshot((s) => cb(s.exists ? mapDraw(s) : null), (e) => onError?.(toAppError(e)));
  },
  watchJackpotWinners(cb, onError, limit = 5) {
    return db.collection('jackpotRounds').where('status', '==', 'drawn').orderBy('drawAt', 'desc').limit(limit)
      .onSnapshot((s) => cb(s.docs.map(mapDraw)), (e) => onError?.(toAppError(e)));
  },
};
