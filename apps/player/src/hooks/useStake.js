import { useState } from 'react';

/** Montant de la mise, borné aux limites du jeu. Les boutons −/+ avancent par paliers (100 ou 500). */
export function useStake({ minStake, maxStake, quickStakes }, initial = quickStakes[0]) {
  const [stake, setStakeRaw] = useState(Math.min(initial, maxStake));
  const clamp = (v) => Math.max(minStake, Math.min(maxStake, v));
  const step = maxStake <= 1_000 ? 100 : 500;
  return {
    stake,
    setStake: (v) => setStakeRaw(clamp(v)),
    increase: () => setStakeRaw((v) => clamp(v + step)),
    decrease: () => setStakeRaw((v) => clamp(v - step)),
    quickStakes, min: minStake, max: maxStake,
  };
}
