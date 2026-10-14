import { randomInt } from 'node:crypto';

/** Générateur cryptographique utilisé pour tous les tirages : rng(n) -> entier dans [0, n). */
export const secureRng = (n) => randomInt(n);
