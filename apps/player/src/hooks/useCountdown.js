import { useEffect, useState } from 'react';

/** Compte à rebours en secondes ; restart(n) le relance. */
export function useCountdown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return { left, label, done: left <= 0, restart: setLeft };
}
