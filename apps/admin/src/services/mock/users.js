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

const mockTransactions = {
  p1: [
    { id: 'tx1', type: 'deposit', amount: 50_000, status: 'success', createdAt: new Date('2026-08-20'), method: 'mtn', reference: 'DEP001' },
    { id: 'tx2', type: 'deposit', amount: 75_000, status: 'success', createdAt: new Date('2026-08-25'), method: 'moov', reference: 'DEP002' },
    { id: 'tx3', type: 'withdrawal', amount: 20_000, status: 'success', createdAt: new Date('2026-09-05'), method: 'mtn', reference: 'WTH001' },
    { id: 'tx4', type: 'deposit', amount: 85_000, status: 'success', createdAt: new Date('2026-09-10'), method: 'card', reference: 'DEP003' },
    { id: 'tx5', type: 'withdrawal', amount: 10_000, status: 'success', createdAt: new Date('2026-09-12'), method: 'mtn', reference: 'WTH002' },
  ],
  p2: [
    { id: 'tx10', type: 'deposit', amount: 30_000, status: 'success', createdAt: new Date('2026-09-02'), method: 'mtn', reference: 'DEP004' },
    { id: 'tx11', type: 'deposit', amount: 60_000, status: 'success', createdAt: new Date('2026-09-08'), method: 'moov', reference: 'DEP005' },
  ],
  p3: [
    { id: 'tx20', type: 'deposit', amount: 30_000, status: 'success', createdAt: new Date('2026-09-12'), method: 'mtn', reference: 'DEP006' },
    { id: 'tx21', type: 'deposit', amount: 30_000, status: 'success', createdAt: new Date('2026-09-15'), method: 'mtn', reference: 'DEP007' },
    { id: 'tx22', type: 'withdrawal', amount: 15_000, status: 'success', createdAt: new Date('2026-09-20'), method: 'mtn', reference: 'WTH003' },
  ],
  p4: [
    { id: 'tx30', type: 'deposit', amount: 25_000, status: 'success', createdAt: new Date('2026-09-06'), method: 'mtn', reference: 'DEP008' },
    { id: 'tx31', type: 'deposit', amount: 25_000, status: 'success', createdAt: new Date('2026-09-08'), method: 'moov', reference: 'DEP009' },
    { id: 'tx32', type: 'deposit', amount: 24_000, status: 'success', createdAt: new Date('2026-09-12'), method: 'mtn', reference: 'DEP010' },
    { id: 'tx33', type: 'withdrawal', amount: 12_000, status: 'success', createdAt: new Date('2026-09-18'), method: 'mtn', reference: 'WTH004' },
    { id: 'tx34', type: 'withdrawal', amount: 8_000, status: 'success', createdAt: new Date('2026-09-22'), method: 'moov', reference: 'WTH005' },
  ],
};

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

  async getUserTransactions(uid, limit = 50) {
    await delay();
    const txs = mockTransactions[uid] || [];
    return txs.slice(0, limit);
  },

  async listTransactions({ typeFilter = null, statusFilter = null, search = '', limit = 100 } = {}) {
    await delay();
    // Agréger toutes les transactions
    let allTxs = [];
    for (const uid of Object.keys(mockTransactions)) {
      const user = users.find((u) => u.uid === uid);
      if (!user) continue;
      for (const tx of mockTransactions[uid]) {
        allTxs.push({
          ...tx,
          uid,
          phone: user.phone,
          fullName: user.fullName,
        });
      }
    }

    // Trier par date décroissante
    allTxs.sort((a, b) => b.createdAt - a.createdAt);

    // Filtrer
    if (typeFilter) {
      allTxs = allTxs.filter((tx) => tx.type === typeFilter);
    }
    if (statusFilter) {
      allTxs = allTxs.filter((tx) => tx.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      allTxs = allTxs.filter(
        (tx) =>
          tx.phone.includes(q) ||
          tx.fullName.toLowerCase().includes(q) ||
          (tx.reference || '').toLowerCase().includes(q)
      );
    }

    return allTxs.slice(0, limit);
  },

  async listKYCRequests({ statusFilter = null, limit = 100 } = {}) {
    await delay();
    let requests = users.filter((u) => ['pending', 'rejected'].includes(u.kycStatus));

    if (statusFilter) {
      requests = requests.filter((u) => u.kycStatus === statusFilter);
    }

    return requests.map((u) => ({
      uid: u.uid,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      kycStatus: u.kycStatus,
      status: u.status,
      kycSubmittedAt: u.kycSubmittedAt || null,
      kycReviewedAt: u.kycReviewedAt || null,
      kycReviewedBy: u.kycReviewedBy || null,
      kycRejectionReason: u.kycRejectionReason || null,
      createdAt: u.createdAt,
      totalDeposited: u.totalDeposited,
    })).slice(0, limit);
  },

  async approveKYC(uid) {
    await delay(300);
    const u = users.find((x) => x.uid === uid);
    if (!u) throw new Error('Utilisateur introuvable.');
    u.kycStatus = 'verified';
    u.kycReviewedAt = new Date();
    u.kycReviewedBy = 'admin@wynveo.com';
    u.kycRejectionReason = null;
    emit();
    return { ok: true };
  },

  async rejectKYC(uid, reason) {
    await delay(300);
    if (!String(reason ?? '').trim()) {
      throw new Error('Veuillez indiquer la raison du rejet.');
    }
    const u = users.find((x) => x.uid === uid);
    if (!u) throw new Error('Utilisateur introuvable.');
    u.kycStatus = 'rejected';
    u.kycReviewedAt = new Date();
    u.kycReviewedBy = 'admin@wynveo.com';
    u.kycRejectionReason = reason.trim();
    emit();
    return { ok: true };
  },
};
