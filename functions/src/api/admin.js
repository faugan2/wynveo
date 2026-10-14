/** Fonctions appelables par le back-office. Chacune vérifie le rôle de l'admin. */
import { onCall } from 'firebase-functions/v2/https';
import { requireRole, ROLES } from '../lib/guards.js';
import { reviewWithdrawal } from '../services/withdrawalService.js';

export const adminReviewWithdrawal = onCall(async (request) => {
  const admin = requireRole(request, [ROLES.SUPER, ROLES.FINANCE]);
  return reviewWithdrawal(admin, request.data ?? {});
});
