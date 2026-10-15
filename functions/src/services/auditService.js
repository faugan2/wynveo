import { db } from '../lib/firebase.js';

/**
 * Service d'audit : logging des actions admin et consultation des logs.
 */

export async function logAuditAction(admin, action, details) {
  await db.collection('audit_logs').add({
    adminId: admin.uid,
    adminEmail: admin.email,
    action,
    details: details || {},
    timestamp: new Date(),
    ipAddress: null,
    userAgent: null,
  });
}

export async function getAuditLogs(options = {}) {
  const { limit = 100, adminFilter = null, actionFilter = null, startDate = null, endDate = null } = options;

  let query = db.collection('audit_logs');

  if (adminFilter) {
    query = query.where('adminEmail', '==', adminFilter);
  }

  if (actionFilter) {
    query = query.where('action', '==', actionFilter);
  }

  const logs = await query
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  let result = logs.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Client-side date filtering (Firestore doesn't allow range queries easily)
  if (startDate || endDate) {
    result = result.filter((log) => {
      const ts = log.timestamp?.toDate?.() || new Date(log.timestamp);
      if (startDate && ts < startDate) return false;
      if (endDate && ts > endDate) return false;
      return true;
    });
  }

  return result;
}

export async function getAuditStats() {
  const logs = await db.collection('audit_logs')
    .orderBy('timestamp', 'desc')
    .limit(500)
    .get();

  const data = logs.docs.map((d) => d.data());

  // Aggregate stats
  const byAction = {};
  const byAdmin = {};
  let total = 0;

  data.forEach((log) => {
    total++;
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byAdmin[log.adminEmail] = (byAdmin[log.adminEmail] || 0) + 1;
  });

  return {
    totalLogs: total,
    byAction: Object.entries(byAction).map(([action, count]) => ({ action, count })),
    byAdmin: Object.entries(byAdmin).map(([email, count]) => ({ email, count })),
    topActions: Object.entries(byAction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count })),
  };
}
