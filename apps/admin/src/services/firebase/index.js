import { auth, db, functions } from '../../config/firebase.js';
import { wrap, toAppError, AppError } from '../errors.js';

export const dataSource = 'firebase';
const STAFF_ROLES = ['super', 'finance', 'support', 'trader'];
const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ?? null);

export const adminAuthService = {
  /** cb({ uid, email, role } | null). Un compte sans rôle staff est déconnecté. */
  onAuthChange(cb) {
    return auth.onAuthStateChanged(async (u) => {
      if (!u) return cb(null);
      const token = await u.getIdTokenResult(true);
      const role = token.claims.role;
      if (!STAFF_ROLES.includes(role)) {
        await auth.signOut();
        return cb(null, new AppError('NOT_STAFF', "Ce compte n'a pas accès à l'administration."));
      }
      return cb({ uid: u.uid, email: u.email, role });
    });
  },
  signIn: wrap(async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'].includes(err.code)) {
        throw new AppError(err.code, 'E-mail ou mot de passe incorrect.');
      }
      throw err;
    }
  }),
  signOut: wrap(() => auth.signOut()),
};

/** Fiches joueur en cache pour enrichir les listes. */
const playerCache = new Map();
async function loadPlayer(uid) {
  if (!playerCache.has(uid)) {
    playerCache.set(uid, Promise.all([db.collection('users').doc(uid).get(), db.collection('wallets').doc(uid).get()])
      .then(([u, w]) => ({
        uid,
        fullName: u.data()?.fullName ?? 'Joueur inconnu',
        phone: u.data()?.phone ?? null,
        kycStatus: u.data()?.kycStatus ?? 'none',
        status: u.data()?.status ?? 'active',
        totalDeposited: w.data()?.totalDeposited ?? 0,
        totalWithdrawn: w.data()?.totalWithdrawn ?? 0,
      })));
  }
  return playerCache.get(uid);
}

function mapTx(doc) {
  const d = doc.data();
  return {
    id: doc.id, uid: d.uid, type: d.type, status: d.status, amount: d.amount, reference: d.reference,
    operator: d.operator, msisdn: d.msisdn, failureReason: d.failureReason ?? null, review: d.review ?? null,
    createdAt: toDate(d.createdAt) ?? new Date(),
  };
}

function watchWithPlayers(query, cb, onError) {
  return query.onSnapshot(async (snap) => {
    const txs = snap.docs.map(mapTx);
    const players = await Promise.all(txs.map((t) => loadPlayer(t.uid)));
    cb(txs.map((t, i) => ({ ...t, player: players[i] })));
  }, (err) => onError?.(toAppError(err)));
}

export const withdrawalAdminService = {
  watchPending(cb, onError) {
    return watchWithPlayers(
      db.collection('transactions').where('type', '==', 'withdrawal').where('status', '==', 'pending_review').orderBy('createdAt', 'asc'),
      cb, onError,
    );
  },
  watchRecent(cb, onError, limit = 15) {
    return watchWithPlayers(
      db.collection('transactions').where('type', '==', 'withdrawal').orderBy('createdAt', 'desc').limit(limit),
      cb, onError,
    );
  },
  review: wrap(async ({ txId, decision, reason }) => {
    const res = await functions.httpsCallable('adminReviewWithdrawal')({ txId, decision, reason });
    return res.data;
  }),
};
export { userAdminService } from './userAdminService.js';
export { sportAdminService } from './sportAdminService.js';
