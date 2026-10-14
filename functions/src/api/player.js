/**
 * Fonctions appelables par l'application joueur.
 * Rôle de cette couche : authentifier, lire les paramètres, déléguer au service.
 */
import { onCall } from 'firebase-functions/v2/https';
import { requireAuth, playerPhone } from '../lib/guards.js';
import { completeProfile } from '../services/profileService.js';
import { startDeposit, confirmSimulatedDeposit, cancelDeposit } from '../services/depositService.js';
import { requestWithdrawal } from '../services/withdrawalService.js';

export const playerCompleteProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const { phone, verified } = playerPhone(auth.token);
  return completeProfile(auth.uid, { phone, phoneVerified: verified }, request.data);
});

export const walletCreateDeposit = onCall(async (request) => {
  const { uid } = requireAuth(request);
  return startDeposit(uid, request.data);
});

export const walletConfirmSimulatedDeposit = onCall(async (request) => {
  const { uid } = requireAuth(request);
  return confirmSimulatedDeposit(uid, request.data?.txId);
});

export const walletCancelDeposit = onCall(async (request) => {
  const { uid } = requireAuth(request);
  return cancelDeposit(uid, request.data?.txId);
});

export const walletRequestWithdrawal = onCall(async (request) => {
  const { uid } = requireAuth(request);
  return requestWithdrawal(uid, request.data);
});
