/** Préfixes des références lisibles affichées aux joueurs et à l'admin. */
export const REF_PREFIX = Object.freeze({
  deposit: 'DEP',
  withdrawal: 'RET',
  bonus: 'BON',
});

/**
 * "DEP-1014-77812" : préfixe, mois+jour, 5 chiffres aléatoires.
 * `random` est injectable pour les tests.
 */
export function makeReference(prefix, date = new Date(), random = Math.random) {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const n = String(Math.floor(random() * 100_000)).padStart(5, '0');
  return `${prefix}-${mm}${dd}-${n}`;
}
