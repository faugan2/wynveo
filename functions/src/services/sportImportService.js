/**
 * Import automatique depuis The Odds API (https://the-odds-api.com).
 * - importOdds : crée / met à jour les matchs à venir et leurs cotes (marge Wynveo appliquée).
 * - importScores : passe les matchs en direct / terminés et déclenche le règlement des tickets.
 *
 * Chaque appel à l'API consomme du quota. On n'interroge les scores que pour les compétitions
 * qui ont un match commencé et non terminé. `fetchJson` est injectable pour les tests.
 */
import { logger } from 'firebase-functions/v2';
import { db, COL, FieldValue } from '../lib/firebase.js';
import { sportEventRef } from '../repositories/index.js';
import { ODDS_API_COMPETITIONS, EVENT_STATUS, SPORT_LIMITS, parseOddsEvent, parseScoreEvent } from '../core/index.js';
import { setSportEventResult } from './sportService.js';

const BASE = 'https://api.the-odds-api.com/v4/sports';
const docIdFor = (externalId) => `oa_${externalId}`;

export async function defaultFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`The Odds API ${res.status} : ${await res.text()}`);
  return { data: await res.json(), remaining: res.headers.get('x-requests-remaining') };
}

export async function importOdds({ apiKey, fetchJson = defaultFetchJson, competitions = ODDS_API_COMPETITIONS, margin = SPORT_LIMITS.defaultMargin }) {
  let created = 0;
  let updated = 0;
  let remaining = null;
  for (const comp of competitions) {
    const url = `${BASE}/${comp.key}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso&apiKey=${apiKey}`;
    let res;
    try { res = await fetchJson(url); } catch (err) { logger.warn('Import des cotes échoué', { competition: comp.key, message: err.message }); continue; }
    remaining = res.remaining ?? remaining;
    for (const api of res.data ?? []) {
      const parsed = parseOddsEvent(api, comp, margin);
      if (!parsed) continue;
      const ref = sportEventRef(docIdFor(parsed.externalId));
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          ...parsed, status: EVENT_STATUS.SCHEDULED, suspended: false, score: null, source: 'odds_api', competitionKey: comp.key,
          manualOdds: false, betCount: 0, totalStake: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        });
        created += 1;
      } else if (snap.data().status === EVENT_STATUS.SCHEDULED && !snap.data().manualOdds) {
        // Un admin qui a modifié les cotes à la main garde la main : on ne les écrase pas.
        await ref.update({ markets: parsed.markets, startAt: parsed.startAt, updatedAt: FieldValue.serverTimestamp() });
        updated += 1;
      }
    }
  }
  return { created, updated, remaining };
}

export async function importScores({ apiKey, fetchJson = defaultFetchJson, now = new Date() }) {
  // Matchs commencés mais pas encore réglés, groupés par compétition.
  const open = await db.collection(COL.SPORT_EVENTS).where('status', 'in', [EVENT_STATUS.SCHEDULED, EVENT_STATUS.LIVE]).get();
  const started = open.docs.filter((d) => d.data().source === 'odds_api' && toDate(d.data().startAt) <= now);
  const comps = [...new Set(started.map((d) => d.data().competitionKey))];
  let finished = 0;
  let live = 0;
  for (const key of comps) {
    let res;
    try { res = await fetchJson(`${BASE}/${key}/scores?daysFrom=1&dateFormat=iso&apiKey=${apiKey}`); } catch (err) { logger.warn('Import des scores échoué', { competition: key, message: err.message }); continue; }
    for (const api of res.data ?? []) {
      const s = parseScoreEvent(api);
      const doc = started.find((d) => d.id === docIdFor(s.externalId));
      if (!doc || !s.score) continue;
      if (s.completed) {
        await setSportEventResult(null, { eventId: doc.id, score: s.score });
        finished += 1;
      } else {
        await doc.ref.update({ status: EVENT_STATUS.LIVE, score: s.score, updatedAt: FieldValue.serverTimestamp() });
        live += 1;
      }
    }
  }
  return { checked: comps.length, finished, live };
}

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : new Date(v));
