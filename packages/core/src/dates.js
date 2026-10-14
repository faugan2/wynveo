import { TIMEZONE_OFFSET_MINUTES } from './config.js';

/** Clé de journée locale "2026-10-14", utilisée pour les plafonds journaliers. */
export function dayKey(date = new Date()) {
  const t = new Date(date.getTime() + TIMEZONE_OFFSET_MINUTES * 60_000);
  return t.toISOString().slice(0, 10);
}

/** Remet un compteur journalier à zéro s'il date d'un autre jour. */
export function currentDailyCounter(counter, today) {
  if (counter && counter.date === today) return { date: today, amount: counter.amount || 0 };
  return { date: today, amount: 0 };
}
