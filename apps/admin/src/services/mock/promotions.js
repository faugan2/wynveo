const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const promoCodes = [
  { code: 'WELCOME20', type: 'percent', value: 20, maxUses: 1000, usedCount: 342, minDeposit: 10000, active: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { code: 'DEPOSIT50K', type: 'fixed', value: 5000, maxUses: 500, usedCount: 189, minDeposit: 50000, active: true, expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
  { code: 'FRIEND10', type: 'percent', value: 10, maxUses: 2000, usedCount: 856, minDeposit: 5000, active: true, expiresAt: null },
  { code: 'SUMMER15', type: 'percent', value: 15, maxUses: 300, usedCount: 300, minDeposit: 20000, active: false, expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
];

export const promotionService = {
  async createPromoCode({ code, type, value, maxUses, expiresAt, minDeposit }) {
    await delay();
    const exists = promoCodes.find((p) => p.code === code);
    if (exists) throw new Error('Code existe déjà.');
    promoCodes.push({
      code,
      type,
      value,
      maxUses,
      usedCount: 0,
      minDeposit: minDeposit || 0,
      active: true,
      expiresAt,
    });
    return { ok: true };
  },

  async listPromoCodes({ active = null } = {}) {
    await delay();
    let list = promoCodes;
    if (active !== null) {
      list = list.filter((p) => p.active === active);
    }
    return list;
  },

  async getPromoStats() {
    await delay();
    return {
      totalCodes: promoCodes.length,
      activeCodes: promoCodes.filter((p) => p.active).length,
      totalUsed: promoCodes.reduce((s, p) => s + p.usedCount, 0),
      codes: promoCodes,
    };
  },
};
