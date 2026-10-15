import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.js';

export const adminService = {
  async listAdmins() {
    const fn = httpsCallable(functions, 'adminListAdmins');
    const result = await fn({});
    return result.data;
  },

  async createAdmin(email, role) {
    const fn = httpsCallable(functions, 'adminCreateAdmin');
    const result = await fn({ email, role });
    return result.data;
  },

  async deleteAdmin(adminId) {
    const fn = httpsCallable(functions, 'adminDeleteAdmin');
    const result = await fn({ adminId });
    return result.data;
  },

  async updateAdminRole(adminId, newRole) {
    const fn = httpsCallable(functions, 'adminUpdateAdminRole');
    const result = await fn({ adminId, newRole });
    return result.data;
  },

  async getAuditLogs(options = {}) {
    const fn = httpsCallable(functions, 'adminGetAuditLogs');
    const result = await fn(options);
    return result.data;
  },

  async getAuditStats() {
    const fn = httpsCallable(functions, 'adminGetAuditStats');
    const result = await fn({});
    return result.data;
  },
};
