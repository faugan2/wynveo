/** Matchs de démonstration pour l'admin (en mémoire, perdus au rechargement). */
import { EVENT_STATUS, SPORTS, validateScore, roundOdds } from '@wynveo/core';
import { AppError } from '../errors.js';

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const sub = (fn) => { listeners.add(fn); fn(); return () => listeners.delete(fn); };
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const at = (h) => { const d = new Date(Date.now() + h * 3_600_000); d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0); return d; };
let seq = 10;

const events = [
  { id: 'e1', sport: 'football', league: 'Togo D1', home: 'ASKO Kara', away: 'Dynamic Togolais', startAt: at(2), status: 'scheduled', source: 'manual', manualOdds: true, betCount: 14, totalStake: 52_000, markets: { h2h: { home: 2.12, draw: 2.86, away: 3.18 }, totals: { line: 2.5, over: 1.98, under: 1.78 } } },
  { id: 'e2', sport: 'football', league: 'Premier League', home: 'Arsenal', away: 'Chelsea', startAt: at(4), status: 'scheduled', source: 'odds_api', manualOdds: false, betCount: 41, totalStake: 188_500, markets: { h2h: { home: 1.92, draw: 3.55, away: 3.85 }, totals: { line: 2.5, over: 1.79, under: 1.97 } } },
  { id: 'e3', sport: 'basketball', league: 'NBA', home: 'Boston Celtics', away: 'Los Angeles Lakers', startAt: at(8), status: 'scheduled', source: 'odds_api', manualOdds: false, betCount: 6, totalStake: 21_000, suspended: true, markets: { h2h: { home: 1.57, away: 2.35 } } },
  { id: 'e4', sport: 'football', league: 'Ligue 1', home: 'Paris SG', away: 'Olympique de Marseille', startAt: at(-0.6), status: 'live', score: { home: 1, away: 0 }, source: 'odds_api', manualOdds: false, betCount: 63, totalStake: 310_000, markets: { h2h: { home: 1.54, draw: 4.29, away: 5.49 } } },
  { id: 'e5', sport: 'football', league: 'Togo D1', home: 'Gomido FC', away: 'AS OTR Lomé', startAt: at(-20), status: 'finished', score: { home: 2, away: 1 }, source: 'manual', manualOdds: true, betCount: 9, totalStake: 27_000, settledTickets: 9, paidOut: 18_400, markets: { h2h: { home: 2.69, draw: 3.0, away: 2.8 } } },
].map((e) => ({ suspended: false, score: null, settledTickets: 0, paidOut: 0, ...e }));

const OPEN = [EVENT_STATUS.SCHEDULED, EVENT_STATUS.LIVE];
const find = (id) => { const e = events.find((x) => x.id === id); if (!e) throw new AppError('not-found', 'Match introuvable.'); return e; };
const odds = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 1.01 ? roundOdds(n) : null; };

export const sportAdminService = {
  watchEvents(tab, cb) {
    return sub(() => {
      const list = events.filter((e) => (tab === 'closed' ? !OPEN.includes(e.status) : OPEN.includes(e.status)));
      list.sort((a, b) => (tab === 'closed' ? b.startAt - a.startAt : a.startAt - b.startAt));
      cb(list.map((e) => structuredClone(e)));
    });
  },
  async upsert(data) {
    await delay();
    const sport = SPORTS[data.sport];
    if (!sport) throw new AppError('INVALID_ARGUMENT', 'Choisissez un sport.');
    if (!data.league?.trim() || !data.home?.trim() || !data.away?.trim()) throw new AppError('INVALID_ARGUMENT', 'Indiquez la compétition et les deux équipes.');
    if (data.home.trim().toLowerCase() === data.away.trim().toLowerCase()) throw new AppError('INVALID_ARGUMENT', 'Les deux équipes doivent être différentes.');
    const h = data.markets?.h2h ?? {};
    const h2h = { home: odds(h.home), away: odds(h.away), ...(sport.hasDraw ? { draw: odds(h.draw) } : {}) };
    if (!h2h.home || !h2h.away || (sport.hasDraw && !h2h.draw)) throw new AppError('INVALID_ARGUMENT', 'Toutes les cotes du résultat doivent être supérieures à 1,01.');
    const markets = { h2h };
    const t = data.markets?.totals;
    if (t && (t.over || t.under)) {
      if (!(Number(t.line) > 0) || !odds(t.over) || !odds(t.under)) throw new AppError('INVALID_ARGUMENT', 'Le total doit avoir une ligne et deux cotes valides.');
      markets.totals = { line: Number(t.line), over: odds(t.over), under: odds(t.under) };
    }
    const fields = { sport: sport.id, league: data.league.trim(), home: data.home.trim(), away: data.away.trim(), startAt: new Date(data.startAt), markets, manualOdds: true };
    if (data.id) {
      const e = find(data.id);
      if (!OPEN.includes(e.status)) throw new AppError('failed-precondition', 'Ce match est terminé : il ne peut plus être modifié.');
      Object.assign(e, fields);
    } else {
      events.push({ id: `e${++seq}`, status: 'scheduled', suspended: false, score: null, source: 'manual', betCount: 0, totalStake: 0, settledTickets: 0, paidOut: 0, ...fields });
    }
    emit();
    return { id: data.id ?? `e${seq}` };
  },
  async setSuspended({ eventId, suspended }) {
    await delay(250);
    find(eventId).suspended = suspended;
    emit();
    return { ok: true };
  },
  async setResult({ eventId, score, cancelled }) {
    await delay();
    const e = find(eventId);
    if (!OPEN.includes(e.status)) throw new AppError('failed-precondition', 'Le résultat de ce match est déjà enregistré.');
    if (!cancelled) { const v = validateScore(score); if (!v.ok) throw new AppError(v.code, v.message); }
    Object.assign(e, { status: cancelled ? 'cancelled' : 'finished', score: cancelled ? null : score, settledTickets: e.betCount, paidOut: cancelled ? e.totalStake : Math.round(e.totalStake * 0.8) });
    emit();
    return { settled: e.betCount, paid: e.paidOut };
  },
  async importNow() {
    await delay(900);
    return { created: 0, updated: 3, remaining: 'démo' };
  },
};
