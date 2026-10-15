import { useEffect, useMemo, useState } from 'react';
import { SPORTS, marginOf } from '@wynveo/core';
import { sportAdminService } from '../services/index.js';

/** Liste des matchs, onglet 'open' (à venir / en direct) ou 'closed' (terminés). */
export function useAdminSportEvents(tab, search = '', sportFilter = null, leagueFilter = null) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { setItems(null); return sportAdminService.watchEvents(tab, setItems, (e) => setError(e.message)); }, [tab]);

  const filtered = useMemo(() => {
    let list = items ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.home.toLowerCase().includes(q) || e.away.toLowerCase().includes(q));
    }
    if (sportFilter) {
      list = list.filter((e) => e.sport === sportFilter);
    }
    if (leagueFilter) {
      list = list.filter((e) => e.league === leagueFilter);
    }
    return list;
  }, [items, search, sportFilter, leagueFilter]);

  const stats = useMemo(() => {
    const list = filtered;
    const byStats = {};
    list.forEach((e) => {
      const key = e.sport;
      if (!byStats[key]) byStats[key] = { stake: 0, bets: 0, paidOut: 0 };
      byStats[key].stake += e.totalStake || 0;
      byStats[key].bets += e.betCount || 0;
      byStats[key].paidOut += e.paidOut || 0;
    });

    return {
      count: list.length,
      bets: list.reduce((s, e) => s + e.betCount, 0),
      stake: list.reduce((s, e) => s + e.totalStake, 0),
      paidOut: list.reduce((s, e) => s + (e.paidOut || 0), 0),
      suspended: list.filter((e) => e.suspended).length,
      bySport: byStats,
      roi: list.reduce((s, e) => s + e.totalStake, 0) > 0
        ? (list.reduce((s, e) => s + (e.paidOut || 0), 0) / list.reduce((s, e) => s + e.totalStake, 0) * 100 - 100).toFixed(1)
        : 0,
      profitLoss: list.reduce((s, e) => s + (e.paidOut || 0), 0) - list.reduce((s, e) => s + e.totalStake, 0),
    };
  }, [filtered]);

  const leagues = useMemo(() => [...new Set((items ?? []).map((e) => e.league))], [items]);

  return {
    items: filtered,
    allItems: items ?? [],
    loading: items === null && !error,
    error,
    stats,
    leagues,
  };
}

/** Actions de l'admin sur les matchs, avec l'état « en cours » et le dernier message. */
export function useSportActions() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const run = (key, fn, success) => async (...args) => {
    setBusy(key); setError(null); setInfo(null);
    try {
      const res = await fn(...args);
      if (success) setInfo(success(res));
      return res ?? true;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(null);
    }
  };
  return {
    busy, error, info, clear: () => { setError(null); setInfo(null); }, clearError: () => setError(null),
    save: run('save', sportAdminService.upsert, () => 'Match enregistré.'),
    suspend: (eventId, suspended) => run(`susp-${eventId}`, sportAdminService.setSuspended)({ eventId, suspended }),
    result: run('result', sportAdminService.setResult, (r) => `Résultat enregistré : ${r.settled} ticket(s) réglé(s).`),
    importNow: run('import', sportAdminService.importNow, (r) => `Import terminé : ${r.created} créé(s), ${r.updated} mis à jour. Requêtes restantes : ${r.remaining ?? '?'}.`),
  };
}

const pad = (n) => String(n).padStart(2, '0');
/** Date -> valeur d'un champ datetime-local (heure locale). */
export function toLocalInput(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

const str = (v) => (v === undefined || v === null ? '' : String(v));

/**
 * Formulaire d'un match (création ou modification).
 * Les valeurs restent des textes pendant la saisie ; payload() les convertit pour le serveur.
 */
export function useEventForm(event) {
  const initial = () => {
    const sport = event?.sport ?? 'football';
    const h = event?.markets?.h2h ?? {};
    const t = event?.markets?.totals ?? {};
    const start = event?.startAt ?? new Date(Date.now() + 2 * 3_600_000);
    return {
      sport, league: event?.league ?? '', home: event?.home ?? '', away: event?.away ?? '', startAt: toLocalInput(start),
      h2hHome: str(h.home), h2hDraw: str(h.draw), h2hAway: str(h.away),
      totalsLine: str(t.line ?? (event ? '' : SPORTS[sport].defaultTotalsLine)), over: str(t.over), under: str(t.under),
    };
  };
  const [values, setValues] = useState(initial);
  const set = (k) => (e) => setValues((v) => {
    const next = { ...v, [k]: e.target.value };
    if (k === 'sport' && !event) next.totalsLine = String(SPORTS[e.target.value].defaultTotalsLine);
    return next;
  });
  const hasDraw = SPORTS[values.sport]?.hasDraw;
  const num = (s) => Number(String(s).replace(',', '.'));

  const margins = useMemo(() => {
    const h2h = (hasDraw ? [values.h2hHome, values.h2hDraw, values.h2hAway] : [values.h2hHome, values.h2hAway]).map(num);
    const tot = [values.over, values.under].map(num);
    const m = (xs) => (xs.every((x) => x > 1) ? marginOf(xs) : null);
    return { h2h: m(h2h), totals: m(tot) };
  }, [values, hasDraw]);

  const payload = () => ({
    id: event?.id, sport: values.sport, league: values.league, home: values.home, away: values.away,
    startAt: new Date(values.startAt).toISOString(),
    markets: {
      h2h: { home: num(values.h2hHome), away: num(values.h2hAway), ...(hasDraw ? { draw: num(values.h2hDraw) } : {}) },
      ...(values.over || values.under ? { totals: { line: num(values.totalsLine), over: num(values.over), under: num(values.under) } } : {}),
    },
  });
  return { values, set, hasDraw, margins, payload, isEdit: Boolean(event) };
}
