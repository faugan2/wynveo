import { describe, it, expect, beforeEach } from 'vitest';
import * as adminsMock from '../../src/services/mock/admins.js';
import * as auditMock from '../../src/services/mock/audit.js';
import * as promosMock from '../../src/services/mock/promotions.js';

describe('Admin Services', () => {
  describe('adminService - admins', () => {
    it('should list admins', async () => {
      const admins = await adminsMock.listAdmins();
      expect(admins).toBeInstanceOf(Array);
      expect(admins.length).toBeGreaterThan(0);
      expect(admins[0]).toHaveProperty('email');
      expect(admins[0]).toHaveProperty('role');
    });

    it('should create admin with valid data', async () => {
      const initialCount = (await adminsMock.listAdmins()).length;

      await adminsMock.createAdmin(
        { uid: 'a1', email: 'admin@test.com' },
        { email: 'newadmin@test.com', role: 'support' }
      );

      const updated = await adminsMock.listAdmins();
      expect(updated.length).toBe(initialCount + 1);
      expect(updated.some((a) => a.email === 'newadmin@test.com')).toBe(true);
    });

    it('should reject duplicate admin email', async () => {
      await expect(
        adminsMock.createAdmin(
          { uid: 'a1' },
          { email: 'admin@wynveo.com', role: 'support' }
        )
      ).rejects.toThrow('existe déjà');
    });

    it('should update admin role', async () => {
      const admins = await adminsMock.listAdmins();
      const targetId = admins[0].id;
      const oldRole = admins[0].role;

      await adminsMock.updateAdminRole(
        { uid: 'a1' },
        targetId,
        'finance'
      );

      const updated = await adminsMock.listAdmins();
      const target = updated.find((a) => a.id === targetId);
      expect(target.role).toBe('finance');
      expect(target.role).not.toBe(oldRole);
    });

    it('should delete admin', async () => {
      const initialCount = (await adminsMock.listAdmins()).length;
      const admins = await adminsMock.listAdmins();
      const targetId = admins[admins.length - 1].id;

      await adminsMock.deleteAdmin({ uid: 'a1' }, targetId);

      const updated = await adminsMock.listAdmins();
      expect(updated.length).toBe(initialCount - 1);
      expect(updated.find((a) => a.id === targetId)).toBeUndefined();
    });
  });

  describe('auditService', () => {
    it('should return audit logs', async () => {
      const logs = await auditMock.getAuditLogs();
      expect(logs).toBeInstanceOf(Array);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toHaveProperty('action');
      expect(logs[0]).toHaveProperty('adminEmail');
      expect(logs[0]).toHaveProperty('timestamp');
    });

    it('should filter logs by admin', async () => {
      const logs = await auditMock.getAuditLogs({ adminFilter: 'admin@wynveo.com' });

      const allLogsFromAdmin = logs.every((l) => l.adminEmail === 'admin@wynveo.com');
      expect(allLogsFromAdmin).toBe(true);
    });

    it('should filter logs by action', async () => {
      const logs = await auditMock.getAuditLogs({ actionFilter: 'user_suspended' });

      const allOfAction = logs.every((l) => l.action === 'user_suspended');
      expect(allOfAction).toBe(true);
    });

    it('should return audit stats', async () => {
      const stats = await auditMock.getAuditStats();

      expect(stats).toHaveProperty('totalLogs');
      expect(stats).toHaveProperty('byAction');
      expect(stats).toHaveProperty('byAdmin');
      expect(stats).toHaveProperty('topActions');
      expect(stats.byAction).toBeInstanceOf(Array);
      expect(stats.byAdmin).toBeInstanceOf(Array);
    });
  });

  describe('promotionService', () => {
    it('should list promo codes', async () => {
      const codes = await promosMock.promotionService.listPromoCodes();
      expect(codes).toBeInstanceOf(Array);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes[0]).toHaveProperty('code');
      expect(codes[0]).toHaveProperty('type');
      expect(codes[0]).toHaveProperty('value');
    });

    it('should create promo code', async () => {
      const initialCount = (await promosMock.promotionService.listPromoCodes()).length;

      await promosMock.promotionService.createPromoCode({
        code: 'TEST123',
        type: 'percent',
        value: 25,
        maxUses: 100,
        minDeposit: 5000,
        expiresAt: null,
      });

      const updated = await promosMock.promotionService.listPromoCodes();
      expect(updated.length).toBe(initialCount + 1);
      expect(updated.some((c) => c.code === 'TEST123')).toBe(true);
    });

    it('should reject duplicate promo code', async () => {
      await expect(
        promosMock.promotionService.createPromoCode({
          code: 'WELCOME20',
          type: 'percent',
          value: 20,
        })
      ).rejects.toThrow('existe déjà');
    });

    it('should return promo stats', async () => {
      const stats = await promosMock.promotionService.getPromoStats();

      expect(stats).toHaveProperty('totalCodes');
      expect(stats).toHaveProperty('activeCodes');
      expect(stats).toHaveProperty('totalUsed');
      expect(stats).toHaveProperty('codes');
      expect(stats.totalCodes).toBeGreaterThan(0);
    });
  });
});
