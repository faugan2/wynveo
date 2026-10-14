import { EVENT_STATUS } from '@wynveo/core';
import { db, functions } from '../../config/firebase.js';
import { wrap, toAppError } from '../errors.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);
const call = (name) => wrap(async (data) => (await functions.httpsCallable(name)(data)).data);

function mapEvent(doc) {
  const d = doc.data();
  return {
    id: doc.id, sport: d.sport, league: d.league, home: d.home, away: d.away, startAt: toDate(d.startAt),
    status: d.status, suspended: Boolean(d.suspended), score: d.score ?? null, markets: d.markets ?? {},
    source: d.source ?? 'manual', manualOdds: Boolean(d.manualOdds), betCount: d.betCount ?? 0, totalStake: d.totalStake ?? 0,
    settledTickets: d.settledTickets ?? 0, paidOut: d.paidOut ?? 0,
  };
}

/** Matchs et cotes. Toutes les écritures passent par les Cloud Functions (rôles super / trader). */
export const sportAdminService = {
  /** tab : 'open' (à venir + en direct) ou 'closed' (terminés + annulés). */
  watchEvents(tab, cb, onError) {
    const q = tab === 'closed'
      ? db.collection('sportEvents').where('status', 'in', [EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED]).orderBy('startAt', 'desc').limit(50)
      : db.collection('sportEvents').where('status', 'in', [EVENT_STATUS.SCHEDULED, EVENT_STATUS.LIVE]).orderBy('startAt').limit(300);
    return q.onSnapshot((s) => cb(s.docs.map(mapEvent)), (e) => onError?.(toAppError(e)));
  },
  upsert: call('adminSportUpsertEvent'),
  setSuspended: call('adminSportSetSuspended'),
  setResult: call('adminSportSetResult'),
  importNow: call('adminSportImportNow'),
};
