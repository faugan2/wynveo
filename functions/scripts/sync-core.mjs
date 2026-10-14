/**
 * Copie packages/core/src dans functions/src/core.
 * Firebase ne déploie que le dossier functions/ : la logique métier partagée
 * doit donc y être recopiée avant chaque déploiement ou lancement des émulateurs.
 * Ne modifiez jamais functions/src/core à la main.
 */
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '../../packages/core/src');
const to = resolve(here, '../src/core');

rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
writeFileSync(resolve(to, 'README.md'), 'Copie générée de packages/core/src par scripts/sync-core.mjs. Ne pas modifier ici.\n');
console.log(`core synchronisé : ${from} -> ${to}`);
