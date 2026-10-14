import { EVENT_STATUS } from '@wynveo/core';
import { db, functions } from '../../config/firebase.js';
import { wrap, toAppError } from '../errors.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);

export function mapEvent(doc) {
  const d = doc.data();
  return {
    id: doc.id, sport: d.sport, league: d.league, home: d.home, away: d.away, startAt: toDate(d.startAt),
    status: d.status, suspended: Boolean(d.suspended), score: d.score ?? null, markets: d.markets ?? {},
  };
}

/** Sport : les matchs se lisent directement, les paris passent par la Cloud Function sportPlaceBet. */
export const sportService = {
  demo: null,

  /** Matchs à venir et en cours, triés par heure de début. */
  watchEvents(cb, onError) {
    return db.collection('sportEvents').where('status', 'in', [EVENT_STATUS.SCHEDULED, EVENT_STATUS.LIVE]).orderBy('startAt').limit(300)
      .onSnapshot((s) => cb(s.docs.map(mapEvent)), (e) => onError?.(toAppError(e)));
  },
  watchEvent(id, cb, onError) {
    return db.collection('sportEvents').doc(id)
      .onSnapshot((s) => cb(s.exists ? mapEvent(s) : null), (e) => onError?.(toAppError(e)));
  },

  /** { type, stake, selections: [{ eventId, market, outcome, odds }], acceptOddsChanges } */
  placeBet: wrap(async (input) => (await functions.httpsCallable('sportPlaceBet')(input)).data),
};
