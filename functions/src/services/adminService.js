import { db } from '../firebase.js';
import { AppError } from '../errors.js';

/**
 * Gestion des administrateurs : création, suppression, rôles.
 * Les modifications d'admins sont automatiquement loggées dans audit_logs.
 */

export async function listAdmins() {
  const snap = await db.collection('admins').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createAdmin(currentAdmin, { email, role }) {
  if (!['super', 'finance', 'support', 'trader'].includes(role)) {
    throw new AppError('INVALID_ROLE', `Rôle invalide: ${role}`);
  }

  const existing = await db.collection('admins').where('email', '==', email).get();
  if (!existing.empty) {
    throw new AppError('ALREADY_EXISTS', `Un admin avec cet e-mail existe déjà.`);
  }

  const newAdmin = {
    email,
    role,
    createdAt: new Date(),
    createdBy: currentAdmin.uid,
  };

  const ref = await db.collection('admins').add(newAdmin);

  // Log audit
  await logAuditAction(currentAdmin, 'admin_created', { adminId: ref.id, email, role });

  return { id: ref.id, ...newAdmin };
}

export async function deleteAdmin(currentAdmin, adminId) {
  const admin = await db.collection('admins').doc(adminId).get();
  if (!admin.exists) {
    throw new AppError('NOT_FOUND', 'Admin non trouvé.');
  }

  const data = admin.data();
  await db.collection('admins').doc(adminId).delete();

  // Log audit
  await logAuditAction(currentAdmin, 'admin_deleted', { adminId, email: data.email, role: data.role });
}

export async function updateAdminRole(currentAdmin, adminId, newRole) {
  if (!['super', 'finance', 'support', 'trader'].includes(newRole)) {
    throw new AppError('INVALID_ROLE', `Rôle invalide: ${newRole}`);
  }

  const admin = await db.collection('admins').doc(adminId).get();
  if (!admin.exists) {
    throw new AppError('NOT_FOUND', 'Admin non trouvé.');
  }

  const oldRole = admin.data().role;
  await db.collection('admins').doc(adminId).update({ role: newRole });

  // Log audit
  await logAuditAction(currentAdmin, 'admin_role_changed', { adminId, email: admin.data().email, oldRole, newRole });
}

async function logAuditAction(admin, action, details) {
  await db.collection('audit_logs').add({
    adminId: admin.uid,
    adminEmail: admin.email,
    action,
    details,
    timestamp: new Date(),
    ipAddress: null,
    userAgent: null,
  });
}
