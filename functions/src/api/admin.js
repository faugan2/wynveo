/** Fonctions appelables par le back-office. Chacune vérifie le rôle de l'admin. */
import { onCall } from 'firebase-functions/v2/https';
import { requireRole, ROLES } from '../lib/guards.js';
import { reviewWithdrawal } from '../services/withdrawalService.js';
import { getFinancialSummary, getUserFinancialStats, getReportByPeriod } from '../services/reportsService.js';
import { createPromoCode, listPromoCodes, validatePromoCode, usePromoCode, getPromoStats } from '../services/promotionService.js';

export const adminReviewWithdrawal = onCall(async (request) => {
  const admin = requireRole(request, [ROLES.SUPER, ROLES.FINANCE]);
  return reviewWithdrawal(admin, request.data ?? {});
});

/** Utilisateurs : liste, détail, suspension, reset password. */
import { listUsers, getUser, setSuspended, resetPassword, getUserTransactions, listTransactions, listKYCRequests, approveKYC, rejectKYC } from '../services/userAdminService.js';

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

export const adminGetUserTransactions = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return getUserTransactions(request.data.uid, request.data.limit ?? 50);
});

export const adminListTransactions = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return listTransactions(request.data);
});

export const adminListKYCRequests = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return listKYCRequests(request.data);
});

export const adminApproveKYC = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return approveKYC(requireRole(request, ['super', 'support']), request.data.uid);
});

export const adminRejectKYC = onCall(async (request) => {
  requireRole(request, ['super', 'support']);
  return rejectKYC(requireRole(request, ['super', 'support']), request.data.uid, request.data.reason);
});

/** Rapports et analytics. */
export const adminGetFinancialSummary = onCall(async (request) => {
  requireRole(request, ['super', 'finance']);
  return getFinancialSummary(request.data);
});

export const adminGetUserFinancialStats = onCall(async (request) => {
  requireRole(request, ['super', 'finance']);
  return getUserFinancialStats(request.data);
});

export const adminGetReportByPeriod = onCall(async (request) => {
  requireRole(request, ['super', 'finance']);
  return getReportByPeriod(request.data);
});

/** Promotions. */
export const adminCreatePromoCode = onCall(async (request) => {
  const admin = requireRole(request, ['super', 'finance']);
  return createPromoCode(admin, request.data);
});

export const adminListPromoCodes = onCall(async (request) => {
  requireRole(request, ['super', 'finance', 'support']);
  return listPromoCodes(request.data);
});

export const adminGetPromoStats = onCall(async (request) => {
  requireRole(request, ['super', 'finance']);
  return getPromoStats();
});

/** Admins et Audit. */
import { listAdmins, createAdmin, deleteAdmin, updateAdminRole } from '../services/adminService.js';
import { logAuditAction, getAuditLogs, getAuditStats } from '../services/auditService.js';

export const adminListAdmins = onCall(async (request) => {
  requireRole(request, ['super']);
  return listAdmins();
});

export const adminCreateAdmin = onCall(async (request) => {
  const admin = requireRole(request, ['super']);
  return createAdmin(admin, request.data);
});

export const adminDeleteAdmin = onCall(async (request) => {
  const admin = requireRole(request, ['super']);
  return deleteAdmin(admin, request.data.adminId);
});

export const adminUpdateAdminRole = onCall(async (request) => {
  const admin = requireRole(request, ['super']);
  return updateAdminRole(admin, request.data.adminId, request.data.newRole);
});

export const adminGetAuditLogs = onCall(async (request) => {
  requireRole(request, ['super']);
  return getAuditLogs(request.data);
});

export const adminGetAuditStats = onCall(async (request) => {
  requireRole(request, ['super']);
  return getAuditStats();
});
