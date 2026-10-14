/**
 * Mini base de données en mémoire pour le mode démo (VITE_DATA_SOURCE=mock).
 * Sauvegardée dans le navigateur pour survivre au rechargement de la page.
 */
const KEY = 'wynveo-mock-v3';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const revive = (o, keys) => keys.forEach((k) => { if (o[k]) o[k] = new Date(o[k]); });
      s.transactions.forEach((t) => revive(t, ['createdAt', 'updatedAt']));
      (s.bets ??= []).forEach((b) => revive(b, ['createdAt', 'settledAt', 'drawAt']));
      Object.values(s.lnDraws ??= {}).forEach((d) => revive(d, ['drawAt']));
      Object.values(s.jackpotRounds ??= {}).forEach((r) => revive(r, ['drawAt']));
      Object.values(s.sportEvents ??= {}).forEach((e) => revive(e, ['startAt']));
      s.bets.forEach((b) => b.selections?.forEach((x) => revive(x, ['startAt'])));
      return s;
    }
  } catch { /* stockage indisponible */ }
  return { session: null, accounts: {}, users: {}, wallets: {}, transactions: [], bets: [], lnDraws: {}, jackpotRounds: {}, sportEvents: {} };
}

export const state = load();

export function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignoré */ }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  fn();
  return () => listeners.delete(fn);
}

/** Simule la latence réseau. */
export const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

let seq = 0;
export const newId = () => `mock-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function resetMock() {
  try { localStorage.removeItem(KEY); } catch { /* ignoré */ }
  location.reload();
}
