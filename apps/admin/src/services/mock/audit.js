const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ago = (min) => new Date(Date.now() - min * 60_000);

const logs = [
  {
    id: 'l1',
    adminId: 'a1',
    adminEmail: 'admin@wynveo.com',
    action: 'user_suspended',
    details: { uid: 'p4', reason: 'Suspicious activity' },
    timestamp: ago(30),
  },
  {
    id: 'l2',
    adminId: 'a2',
    adminEmail: 'finance@wynveo.com',
    action: 'withdrawal_approved',
    details: { txId: 't1', amount: 50000 },
    timestamp: ago(45),
  },
  {
    id: 'l3',
    adminId: 'a1',
    adminEmail: 'admin@wynveo.com',
    action: 'kyc_approved',
    details: { uid: 'p1' },
    timestamp: ago(60),
  },
  {
    id: 'l4',
    adminId: 'a3',
    adminEmail: 'support@wynveo.com',
    action: 'password_reset',
    details: { uid: 'p3', email: 'edem@example.com' },
    timestamp: ago(90),
  },
  {
    id: 'l5',
    adminId: 'a2',
    adminEmail: 'finance@wynveo.com',
    action: 'promo_code_created',
    details: { code: 'SUMMER15', type: 'percent', value: 15 },
    timestamp: ago(120),
  },
  {
    id: 'l6',
    adminId: 'a1',
    adminEmail: 'admin@wynveo.com',
    action: 'admin_created',
    details: { adminId: 'a3', email: 'support@wynveo.com', role: 'support' },
    timestamp: ago(150),
  },
  {
    id: 'l7',
    adminId: 'a2',
    adminEmail: 'finance@wynveo.com',
    action: 'withdrawal_rejected',
    details: { txId: 't2', reason: 'Insufficient verification' },
    timestamp: ago(180),
  },
  {
    id: 'l8',
    adminId: 'a1',
    adminEmail: 'admin@wynveo.com',
    action: 'admin_role_changed',
    details: { adminId: 'a2', email: 'finance@wynveo.com', oldRole: 'support', newRole: 'finance' },
    timestamp: ago(240),
  },
];

export async function getAuditLogs(options = {}) {
  await delay();
  const { adminFilter = null, actionFilter = null } = options;

  let result = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  if (adminFilter) {
    result = result.filter((l) => l.adminEmail === adminFilter);
  }

  if (actionFilter) {
    result = result.filter((l) => l.action === actionFilter);
  }

  return result;
}

export async function getAuditStats() {
  await delay();

  const byAction = {};
  const byAdmin = {};

  logs.forEach((log) => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byAdmin[log.adminEmail] = (byAdmin[log.adminEmail] || 0) + 1;
  });

  return {
    totalLogs: logs.length,
    byAction: Object.entries(byAction).map(([action, count]) => ({ action, count })),
    byAdmin: Object.entries(byAdmin).map(([email, count]) => ({ email, count })),
    topActions: Object.entries(byAction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count })),
  };
}
