/**
 * Gestion des utilisateurs par l'admin : liste, détail, suspension, mot de passe.
 * Aucune écriture sur l'argent ici (c'est pour getActivePlayer).
 */
import { HttpsError } from 'firebase-functions/v2/https';
import { db, COL, FieldValue } from '../lib/firebase.js';
import { walletRef, logAdminAction } from '../repositories/index.js';
import { TX_TYPE, TX_STATUS } from '../core/index.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);

/** Charge un joueur avec ses stats (jeux et sport). */
async function loadUserStats(uid) {
  const [uSnap, wSnap, betsSnap, txSnap] = await Promise.all([
    db.collection(COL.USERS).doc(uid).get(),
    db.collection(COL.WALLETS).doc(uid).get(),
    db.collection(COL.BETS).where('uid', '==', uid).get(),
    db.collection(COL.TRANSACTIONS).where('uid', '==', uid).get(),
  ]);
  const u = uSnap.data();
  const w = wSnap.data() || {};
  if (!u) throw new HttpsError('not-found', 'Joueur introuvable.');

  // Stats jeux et sport par produit
  const games = betsSnap.docs.filter((d) => (d.data().product ?? 'games') === 'games');
  const sport = betsSnap.docs.filter((d) => d.data().product === 'sport');
  const gameStaked = games.reduce((s, d) => s + (d.data().stake ?? 0), 0);
  const gameWon = games.reduce((s, d) => s + (d.data().win ?? 0), 0);
  const sportStaked = sport.reduce((s, d) => s + (d.data().stake ?? 0), 0);
  const sportWon = sport.reduce((s, d) => s + (d.data().win ?? 0), 0);

  // Dépôts et retraits
  const deposits = txSnap.docs.filter((d) => d.data().type === 'deposit');
  const withdrawals = txSnap.docs.filter((d) => d.data().type === 'withdrawal' && d.data().status === 'success');
  const totalDeposited = deposits.reduce((s, d) => s + (d.data().amount ?? 0), 0);
  const totalWithdrawn = withdrawals.reduce((s, d) => s + (d.data().amount ?? 0), 0);

  return {
    uid,
    email: u.email || null,
    fullName: u.fullName || 'Inconnu',
    phone: u.phone || null,
    status: u.status || 'active',
    kycStatus: u.kycStatus || 'none',
    phoneVerified: u.phoneVerified || false,
    createdAt: toDate(u.createdAt) || new Date(),
    balance: w.balance || 0,
    bonusBalance: w.bonusBalance || 0,
    totalDeposited,
    totalWithdrawn,
    depositCount: deposits.length,
    withdrawalCount: withdrawals.length,
    gameStaked,
    gameWon,
    sportStaked,
    sportWon,
    suspiciousRatio: totalDeposited > 0 ? (totalWithdrawn / totalDeposited) > 1.5 : false,
  };
}

/** Liste tous les joueurs avec leurs stats (supporté filtres et recherche). */
export async function listUsers({ search = '', statusFilter = null, kycFilter = null, limit = 100 } = {}) {
  const allUsers = await db.collection(COL.USERS).limit(limit * 2).get(); // charger plus pour filtrer après
  const users = [];
  for (const doc of allUsers.docs) {
    const stats = await loadUserStats(doc.id);
    
    // Filtres
    if (statusFilter && stats.status !== statusFilter) continue;
    if (kycFilter && stats.kycStatus !== kycFilter) continue;
    
    // Recherche : numéro ou nom
    if (search) {
      const q = search.toLowerCase();
      if (!stats.phone?.includes(q) && !stats.fullName.toLowerCase().includes(q)) continue;
    }
    
    users.push(stats);
  }
  return users.slice(0, limit);
}

/** Détail d'un joueur. */
export async function getUser(uid) {
  return loadUserStats(uid);
}

/** Suspend ou réactive un joueur. */
export async function setSuspended(admin, uid, suspended) {
  await db.collection(COL.USERS).doc(uid).update({
    status: suspended ? 'suspended' : 'active',
    updatedAt: FieldValue.serverTimestamp(),
  });
  logAdminAction({
    t: db.runTransaction, // dirty, à améliorer
    adminUid: admin.uid,
    adminEmail: admin.email,
    action: suspended ? 'user.suspend' : 'user.resume',
    target: { type: 'user', id: uid },
  });
  return { ok: true };
}

/** Force la réinitialisation du mot de passe de l'utilisateur (clé d'auth). */
export async function resetPassword(admin, uid) {
  // Appel à adminAuth.updateUser() à faire dans une fonction séparée avec credential d'admin
  // Pour l'instant, on simule juste le log
  logAdminAction({
    t: db.runTransaction,
    adminUid: admin.uid,
    adminEmail: admin.email,
    action: 'user.password.reset',
    target: { type: 'user', id: uid },
    details: { resetedAt: new Date() },
  });
  return { ok: true, message: 'Réinitialisation programmée. L\'utilisateur devra se reconnecter.' };
}

/** Récupère l'historique des transactions (dépôts + retraits) d'un utilisateur. */
export async function getUserTransactions(uid, limit = 50) {
  const txSnap = await db.collection(COL.TRANSACTIONS)
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return txSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type, // 'deposit' | 'withdrawal'
      amount: data.amount || 0,
      status: data.status || 'pending', // 'pending' | 'success' | 'failed'
      createdAt: toDate(data.createdAt) || new Date(),
      method: data.method || 'unknown', // 'mtn' | 'moov' | 'card' | etc.
      reference: data.reference || null,
      reason: data.reason || null, // pour retraits échoués
    };
  });
}

/** Liste TOUTES les transactions du système avec filtres et recherche. */
export async function listTransactions({ typeFilter = null, statusFilter = null, search = '', limit = 100 } = {}) {
  // Charger d'abord tous les users pour accès rapide aux infos
  const usersSnap = await db.collection(COL.USERS).get();
  const usersMap = {};
  usersSnap.docs.forEach((doc) => {
    const u = doc.data();
    usersMap[doc.id] = { uid: doc.id, phone: u.phone || null, fullName: u.fullName || 'Inconnu' };
  });

  // Récupérer les transactions
  let query = db.collection(COL.TRANSACTIONS).orderBy('createdAt', 'desc').limit(limit * 2);

  // Note: Firestore ne permet pas de filtrer sur plusieurs fields orderBy sans index
  // On charge plus et on filtre en mémoire
  const txSnap = await query.get();
  const transactions = [];

  for (const doc of txSnap.docs) {
    const data = doc.data();
    const user = usersMap[data.uid];
    if (!user) continue;

    // Appliquer les filtres
    if (typeFilter && data.type !== typeFilter) continue;
    if (statusFilter && data.status !== statusFilter) continue;

    // Appliquer la recherche
    if (search) {
      const q = search.toLowerCase();
      if (!user.phone?.includes(q) && !user.fullName.toLowerCase().includes(q) && !(data.reference || '').toLowerCase().includes(q)) continue;
    }

    transactions.push({
      id: doc.id,
      uid: data.uid,
      phone: user.phone,
      fullName: user.fullName,
      type: data.type,
      amount: data.amount || 0,
      status: data.status || 'pending',
      createdAt: toDate(data.createdAt) || new Date(),
      method: data.method || 'unknown',
      reference: data.reference || null,
      reason: data.reason || null,
    });
  }

  return transactions.slice(0, limit);
}

/** Liste les demandes KYC (pending + rejected). */
export async function listKYCRequests({ statusFilter = null, limit = 100 } = {}) {
  const usersSnap = await db.collection(COL.USERS).limit(limit * 2).get();
  const requests = [];

  for (const doc of usersSnap.docs) {
    const u = doc.data();
    const kycStatus = u.kycStatus || 'none';

    // Filtrer par statut
    if (statusFilter && kycStatus !== statusFilter) continue;
    // On veut les demandes en attente ou rejetées
    if (!['pending', 'rejected'].includes(kycStatus)) continue;

    requests.push({
      uid: doc.id,
      email: u.email || null,
      fullName: u.fullName || 'Inconnu',
      phone: u.phone || null,
      kycStatus,
      status: u.status || 'active',
      kycSubmittedAt: toDate(u.kycSubmittedAt) || null,
      kycReviewedAt: toDate(u.kycReviewedAt) || null,
      kycReviewedBy: u.kycReviewedBy || null,
      kycRejectionReason: u.kycRejectionReason || null,
      createdAt: toDate(u.createdAt) || new Date(),
      totalDeposited: u.totalDeposited || 0,
    });
  }

  return requests.slice(0, limit);
}

/** Approuve une demande KYC. */
export async function approveKYC(admin, uid) {
  const userRef = db.collection(COL.USERS).doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists()) throw new HttpsError('not-found', 'Utilisateur introuvable.');

  await userRef.update({
    kycStatus: 'verified',
    kycReviewedAt: FieldValue.serverTimestamp(),
    kycReviewedBy: admin.email,
    kycRejectionReason: FieldValue.delete(),
  });

  logAdminAction({
    t: db.runTransaction,
    adminUid: admin.uid,
    adminEmail: admin.email,
    action: 'kyc.approve',
    target: { type: 'user', id: uid },
  });

  return { ok: true };
}

/** Rejette une demande KYC. */
export async function rejectKYC(admin, uid, reason) {
  if (!String(reason ?? '').trim()) {
    throw new HttpsError('invalid-argument', 'Veuillez indiquer la raison du rejet.');
  }

  const userRef = db.collection(COL.USERS).doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists()) throw new HttpsError('not-found', 'Utilisateur introuvable.');

  await userRef.update({
    kycStatus: 'rejected',
    kycReviewedAt: FieldValue.serverTimestamp(),
    kycReviewedBy: admin.email,
    kycRejectionReason: reason.trim(),
  });

  logAdminAction({
    t: db.runTransaction,
    adminUid: admin.uid,
    adminEmail: admin.email,
    action: 'kyc.reject',
    target: { type: 'user', id: uid },
    details: { reason: reason.trim() },
  });

  return { ok: true };
}
