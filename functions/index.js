/**
 * Point d'entrée des Cloud Functions de Wynveo.
 * Les fonctions sont regroupées par public : joueur, admin, webhooks.
 */
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({ region: 'europe-west1', maxInstances: 20 });

export * from './src/api/player.js';
export * from './src/api/admin.js';
export * from './src/api/webhooks.js';
export * from './src/api/games.js';
export * from './src/api/schedules.js';
