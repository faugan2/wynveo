/** Sport : coupon du joueur, gestion des matchs par l'admin, imports programmés. */
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { requireAuth, requireRole, ROLES } from '../lib/guards.js';
import { placeSportBet, upsertSportEvent, setSportEventSuspended, setSportEventResult } from '../services/sportService.js';
import { importOdds, importScores } from '../services/sportImportService.js';

/** Clé The Odds API, stockée comme secret : firebase functions:secrets:set ODDS_API_KEY */
const ODDS_API_KEY = defineSecret('ODDS_API_KEY');
const TRADERS = [ROLES.SUPER, ROLES.TRADER];

export const sportPlaceBet = onCall(async (request) => placeSportBet(requireAuth(request).uid, request.data));

export const adminSportUpsertEvent = onCall(async (request) => upsertSportEvent(requireRole(request, TRADERS), request.data));
export const adminSportSetSuspended = onCall(async (request) => setSportEventSuspended(requireRole(request, TRADERS), request.data ?? {}));
export const adminSportSetResult = onCall(async (request) => setSportEventResult(requireRole(request, TRADERS), request.data ?? {}));
export const adminSportImportNow = onCall({ secrets: [ODDS_API_KEY] }, async (request) => {
  requireRole(request, TRADERS);
  return importOdds({ apiKey: ODDS_API_KEY.value() });
});

/** Cotes : toutes les 3 heures (environ 6 compétitions × 8 appels par jour). */
export const sportImportOdds = onSchedule({ schedule: '0 */3 * * *', timeZone: 'Africa/Lome', secrets: [ODDS_API_KEY] }, async () => {
  const r = await importOdds({ apiKey: ODDS_API_KEY.value() });
  logger.info('Import des cotes', r);
});

/** Scores : toutes les 20 minutes, seulement pour les compétitions qui ont un match en cours. */
export const sportImportScores = onSchedule({ schedule: '*/20 * * * *', timeZone: 'Africa/Lome', secrets: [ODDS_API_KEY] }, async () => {
  const r = await importScores({ apiKey: ODDS_API_KEY.value() });
  logger.info('Import des scores', r);
});
