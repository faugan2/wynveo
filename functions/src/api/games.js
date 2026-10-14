/** Fonctions appelables par l'application joueur pour les jeux. */
import { onCall } from 'firebase-functions/v2/https';
import { requireAuth } from '../lib/guards.js';
import { playLuckySpin, playMysteryBox, buyLuckyNumber, buyJackpotTickets } from '../services/gameService.js';

export const gamesPlaySpin = onCall(async (request) => playLuckySpin(requireAuth(request).uid, request.data));
export const gamesPlayBox = onCall(async (request) => playMysteryBox(requireAuth(request).uid, request.data));
export const gamesBuyNumbers = onCall(async (request) => buyLuckyNumber(requireAuth(request).uid, request.data));
export const gamesBuyJackpot = onCall(async (request) => buyJackpotTickets(requireAuth(request).uid, request.data));
