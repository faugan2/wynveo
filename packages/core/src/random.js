/**
 * Tirages aléatoires purs. Le générateur est injecté :
 *   rng(n) -> entier uniforme dans [0, n)
 * Côté serveur : crypto.randomInt ; dans les tests : une suite fixe.
 */

/** Indice tiré selon des poids entiers (ex. [8380, 800, ...]). */
export function pickWeighted(weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng(total);
  for (let i = 0; i < weights.length; i += 1) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

/** `count` numéros distincts entre 1 et `max`, triés. */
export function drawDistinct(count, max, rng) {
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = 0; i < count; i += 1) {
    const j = i + rng(max - i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

/** Générateur à partir de Math.random (démo uniquement, jamais pour de l'argent réel). */
export const weakRng = (n) => Math.floor(Math.random() * n);
