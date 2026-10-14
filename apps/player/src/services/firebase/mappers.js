/** Convertit les documents Firestore en objets simples (dates JS, valeurs par défaut). */
const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ?? null);

export function mapProfile(snap) {
  if (!snap.exists) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    fullName: d.fullName,
    phone: d.phone,
    referralCode: d.referralCode,
    phoneVerified: Boolean(d.phoneVerified),
    kycStatus: d.kycStatus ?? 'none',
    status: d.status ?? 'active',
    createdAt: toDate(d.createdAt),
  };
}

export function mapWallet(snap) {
  const d = snap.exists ? snap.data() : {};
  return {
    balance: d.balance ?? 0,
    bonusBalance: d.bonusBalance ?? 0,
    bonusWagerRemaining: d.bonusWagerRemaining ?? 0,
    totalDeposited: d.totalDeposited ?? 0,
    totalWithdrawn: d.totalWithdrawn ?? 0,
    depositCount: d.depositCount ?? 0,
    welcomeBonusGranted: d.welcomeBonusGranted ?? (d.depositCount ?? 0) > 0,
    withdrawnToday: d.withdrawnToday ?? { date: null, amount: 0 },
  };
}

export function mapTransaction(snap) {
  const d = snap.data();
  return {
    id: snap.id,
    type: d.type,
    status: d.status,
    amount: d.amount,
    reference: d.reference,
    operator: d.operator,
    msisdn: d.msisdn,
    product: d.product ?? null,
    label: d.label ?? null,
    balanceAfter: d.balanceAfter ?? null,
    failureReason: d.failureReason ?? null,
    createdAt: toDate(d.createdAt) ?? new Date(),
    updatedAt: toDate(d.updatedAt),
  };
}
