import { useEffect, useState } from 'react';

/** Heure courante, rafraîchie toutes les `intervalMs` (pour les comptes à rebours). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Durée restante découpée pour l'affichage : { h, m, s, total }. */
export function remaining(target, now) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60, total };
}
