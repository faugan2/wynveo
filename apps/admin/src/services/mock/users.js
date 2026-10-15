/**
 * Utilisateurs de démo pour l'admin (en mémoire).
 * Utilisé en mode VITE_DATA_SOURCE=mock.
 */
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const sub = (fn) => { listeners.add(fn); fn(); return () => listeners.delete(fn); };
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const users = [
  { uid: 'p1', fullName: 'Ama Kpodar', phone: '+22891442108', email: 'ama@exemple.com', status: 'active', kycStatus: 'verified', phoneVerified: true, createdAt: new Date('2026-08-15'), balance: 5_000, bonusBalance: 0, totalDeposited: 210_000, totalWithdrawn: 40_000, depositCount: 12, withdrawalCount: 3, gameStaked: 85_000, gameWon: 72_000, sportStaked: 62_000, sportWon: 58_000 },
  { uid: 'p2', fullName: 'Yao Dossou', phone: '+22896771052', email: 'yao@exemple.com', status: 'active', kycStatus: 'verified', phoneVerified: true, createdAt: new Date('2026-09-01'), balance: 12_500, bonusBalance: 5_000, totalDeposited: 90_000, totalWithdrawn: 0, depositCount: 8, withdrawalCount: 0, gameStaked: 45_000, gameWon: 38_000, sportStaked: 0, sportWon: 0 },
  { uid: 'p3', fullName: 'Edem Agbo', phone: '+22892056631', email: 'edem@exemple.com', status: 'active', kycStatus: 'none', phoneVerified: true, createdAt: new Date('2026-09-10'), balance: 3_200, bonusBalance: 0, totalDeposited: 60_000, totalWithdrawn: 15_000, depositCount: 5, withdrawalCount: 1, gameStaked: 28_000, gameWon: 18_000, sportStaked: 12_000, sportWon: 5_000 },
  { uid: 'p4', fullName: 'Afi Folly', phone: '+22890478512', email: 'afi@exemple.com', status: 'suspended', kycStatus: 'pending', phoneVerified: true, createdAt: new Date('2026-09-05'), balance: 0, bonusBalance: 0, totalDeposited: 74_000, totalWithdrawn: 20_000, depositCount: 6, withdrawalCount: 2, gameStaked: 35_000, gameWon: 32_000, sportStaked: 18_000, sportWon: 22_000, suspiciousRatio: true },
];

export const userAdminService = {
  async listUsers({ search = '', statusFilter = null, kycFilter = null, limit = 100 } = {}) {
    await delay();
    let list = users;
    if (statusFilter) list = list.filter((u) => u.status === statusFilter);
    if (kycFilter) list = list.filter((u) => u.kycStatus === kycFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.phone.includes(q) || u.fullName.toLowerCase().includes(q));
    }
    return list.slice(0, limit);
  },

  async getUser(uid) {
    await delay();
    const u = users.find((x) => x.uid === uid);
    if (!u) throw new Error('Joueur introuvable.');
    return { ...u };
  },

  async setSuspended(uid, suspended) {
    await delay(300);
    const u = users.find((x) => x.uid === uid);
    if (!u) throw new Error('Joueur introuvable.');
    u.status = suspended ? 'suspended' : 'active';
    emit();
    return { ok: true };
  },

  async resetPassword(uid) {
    await delay(300);
    const u = users.find((x) => x.uid === uid);
    if (!u) throw new Error('Joueur introuvable.');
    return { ok: true, message: 'Réinitialisation programmée. L\'utilisateur devra se reconnecter.' };
  },
};
