/** Tirages automatiques (Cloud Scheduler, inclus dans le forfait Blaze). */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { runLuckyNumberDraws, runJackpotDraw } from '../services/gameService.js';

/** Lucky Number : toutes les 15 minutes, juste après l'heure du tirage. */
export const luckyNumberDrawTick = onSchedule({ schedule: '0,15,30,45 * * * *', timeZone: 'Africa/Lome', retryCount: 3 }, async () => {
  const done = await runLuckyNumberDraws(new Date());
  logger.info('Tirages Lucky Number', { count: done.length });
});

/** Jackpot : chaque jour à 20:00, heure de Lomé. */
export const jackpotDailyDraw = onSchedule({ schedule: '0 20 * * *', timeZone: 'Africa/Lome', retryCount: 3 }, async () => {
  const done = await runJackpotDraw(new Date());
  logger.info('Tirage Jackpot', { done });
});
