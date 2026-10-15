/**
 * Rapports et analytics : données financières, statistiques utilisateurs.
 */
import { db, COL, FieldValue } from '../lib/firebase.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);

/** Obtient les données financières globales. */
export async function getFinancialSummary({ startDate = null, endDate = null } = {}) {
  const usersSnap = await db.collection(COL.USERS).get();
  const txSnap = await db.collection(COL.TRANSACTIONS).get();
  const betsSnap = await db.collection(COL.BETS).get();

  // Filtrer par date
  const isInRange = (date, start, end) => {
    if (!date) return true;
    const d = toDate(date);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  // Calculer les totaux
  let totalUsers = usersSnap.size;
  let activeUsers = 0;
  let suspendedUsers = 0;
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let totalStaked = 0;
  let totalWon = 0;

  usersSnap.forEach((doc) => {
    const u = doc.data();
    if (u.status === 'active') activeUsers++;
    if (u.status === 'suspended') suspendedUsers++;
    totalDeposited += u.totalDeposited || 0;
    totalWithdrawn += u.totalWithdrawn || 0;
  });

  // Transactions filtrées par date
  txSnap.forEach((doc) => {
    const tx = doc.data();
    if (!isInRange(tx.createdAt, startDate, endDate)) return;
    if (tx.type === 'deposit' && tx.status === 'success') {
      // totalDeposited already counted above
    }
    if (tx.type === 'withdrawal' && tx.status === 'success') {
      // totalWithdrawn already counted above
    }
  });

  // Bets filtrées par date
  betsSnap.forEach((doc) => {
    const bet = doc.data();
    if (!isInRange(bet.createdAt, startDate, endDate)) return;
    totalStaked += bet.stake || 0;
    totalWon += bet.win || 0;
  });

  return {
    date: new Date(),
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalDeposited,
    totalWithdrawn,
    balance: totalDeposited - totalWithdrawn,
    totalStaked,
    totalWon,
    playerROI: totalStaked > 0 ? ((totalWon / totalStaked) * 100 - 100).toFixed(1) : 0,
    platformMargin: totalStaked > 0 ? (((totalStaked - totalWon) / totalStaked) * 100).toFixed(1) : 0,
  };
}

/** Liste les utilisateurs avec leurs stats financières (top/low). */
export async function getUserFinancialStats({ limit = 20, sort = 'top' } = {}) {
  const usersSnap = await db.collection(COL.USERS).get();
  const txSnap = await db.collection(COL.TRANSACTIONS).get();

  const users = [];
  usersSnap.forEach((doc) => {
    const u = doc.data();
    const userTxs = txSnap.docs.filter((t) => t.data().uid === doc.id);
    const deposits = userTxs.filter((t) => t.data().type === 'deposit' && t.data().status === 'success');
    const withdrawals = userTxs.filter((t) => t.data().type === 'withdrawal' && t.data().status === 'success');

    const totalDeposited = deposits.reduce((s, t) => s + (t.data().amount || 0), 0);
    const totalWithdrawn = withdrawals.reduce((s, t) => s + (t.data().amount || 0), 0);

    users.push({
      uid: doc.id,
      fullName: u.fullName || 'Inconnu',
      phone: u.phone || null,
      totalDeposited,
      totalWithdrawn,
      balance: u.balance || 0,
      depositCount: deposits.length,
      withdrawalCount: withdrawals.length,
      status: u.status,
    });
  });

  // Trier
  if (sort === 'top') {
    users.sort((a, b) => b.totalDeposited - a.totalDeposited);
  } else if (sort === 'low') {
    users.sort((a, b) => a.totalDeposited - b.totalDeposited);
  }

  return users.slice(0, limit);
}

/** Récupère les données de rapport par période. */
export async function getReportByPeriod({ startDate, endDate, period = 'day' } = {}) {
  const txSnap = await db.collection(COL.TRANSACTIONS).where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).get();

  const data = {};
  txSnap.forEach((doc) => {
    const tx = doc.data();
    const date = toDate(tx.createdAt);
    let key;

    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'month') {
      key = date.toISOString().substring(0, 7);
    }

    if (!data[key]) {
      data[key] = { date: key, deposits: 0, withdrawals: 0, count: 0 };
    }

    if (tx.type === 'deposit' && tx.status === 'success') {
      data[key].deposits += tx.amount || 0;
    } else if (tx.type === 'withdrawal' && tx.status === 'success') {
      data[key].withdrawals += tx.amount || 0;
    }
    data[key].count++;
  });

  return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
}
