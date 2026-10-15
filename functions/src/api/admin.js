/** Fonctions appelables par le back-office. Chacune vérifie le rôle de l'admin. */
import { onCall } from 'firebase-functions/v2/https';
import { requireRole, ROLES } from '../lib/guards.js';
import { reviewWithdrawal } from '../services/withdrawalService.js';

export const adminReviewWithdrawal = onCall(async (request) => {
  const admin = requireRole(request, [ROLES.SUPER, ROLES.FINANCE]);
  return reviewWithdrawal(admin, request.data ?? {});
});

/** Utilisateurs : liste, détail, suspension, reset password. */
import { listUsers, getUser, setSuspended, resetPassword } from '../services/userAdminService.js';

export const adminListUsers = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return listUsers(request.data);
});

export const adminGetUser = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return getUser(request.data.uid);
});

export const adminSetSuspended = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return setSuspended(requireRole(request, ['super', 'support']), request.data.uid, request.data.suspended);
});

export const adminResetPassword = onCall(async (request) => {
  requireRole(request, ['super']);
  return resetPassword(requireRole(request, ['super']), request.data.uid);
});
