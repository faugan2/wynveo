import { useEffect, useMemo, useState } from 'react';
import { EVENT_STATUS, isEventOpen } from '@wynveo/core';
import { sportService } from '../services/index.js';
import { useNow } from './useNow.js';

const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function dayLabel(date, now = new Date()) {
  const d = new Date(date).toDateString();
  if (d === now.toDateString()) return "Aujourd'hui";
  if (d === new Date(now.getTime() + 86_400_000).toDateString()) return 'Demain';
  const s = DAY.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Matchs à venir et en direct, filtrés par sport et groupés par jour puis par compétition.
 * Un match dont le coup d'envoi est passé n'est plus ouvert aux paris (isEventOpen).
 */
export function useSportEvents({ sport = 'all' } = {}) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const now = useNow(15_000);
  useEffect(() => sportService.watchEvents(setEvents, (e) => setError(e.message)), []);

  const counts = useMemo(() => {
    const c = { all: 0 };
    (events ?? []).forEach((e) => { c.all += 1; c[e.sport] = (c[e.sport] ?? 0) + 1; });
    return c;
  }, [events]);

  const live = useMemo(() => (events ?? []).filter((e) => e.status === EVENT_STATUS.LIVE && (sport === 'all' || e.sport === sport)), [events, sport]);

  const days = useMemo(() => {
    const list = (events ?? []).filter((e) => e.status === EVENT_STATUS.SCHEDULED && (sport === 'all' || e.sport === sport));
    const out = [];
    for (const e of list) {
      const label = dayLabel(e.startAt, now);
      let day = out[out.length - 1];
      if (day?.label !== label) { day = { label, leagues: [] }; out.push(day); }
      let league = day.leagues.find((l) => l.name === e.league && l.sport === e.sport);
      if (!league) { league = { name: e.league, sport: e.sport, events: [] }; day.leagues.push(league); }
      league.events.push({ ...e, open: isEventOpen(e, now) });
    }
    return out;
  }, [events, sport, now]);

  return { loading: events === null, error, days, live, counts };
}

/** Un match, pour la page de détail. */
export function useSportEvent(id) {
  const [event, setEvent] = useState(undefined);
  const now = useNow(15_000);
  useEffect(() => sportService.watchEvent(id, setEvent), [id]);
  return { loading: event === undefined, event: event ? { ...event, open: isEventOpen(event, now) } : event };
}
