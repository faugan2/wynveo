/**
 * Données de démonstration de l'admin (VITE_DATA_SOURCE=mock).
 * Connexion de démo : admin@wynveo.com / demo1234
 */
import { AppError } from '../errors.js';

export const dataSource = 'mock';
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ago = (min) => new Date(Date.now() - min * 60_000);

const players = {
  p1: { uid: 'p1', fullName: 'Ama Kpodar', phone: '+22891442108', kycStatus: 'verified', status: 'active', totalDeposited: 210000, totalWithdrawn: 40000 },
  p2: { uid: 'p2', fullName: 'Yao Dossou', phone: '+22896771052', kycStatus: 'verified', status: 'active', totalDeposited: 90000, totalWithdrawn: 0 },
  p3: { uid: 'p3', fullName: 'Edem Agbo', phone: '+22892056631', kycStatus: 'none', status: 'active', totalDeposited: 60000, totalWithdrawn: 15000 },
  p4: { uid: 'p4', fullName: 'Afi Folly', phone: '+22890478512', kycStatus: 'pending', status: 'active', totalDeposited: 74000, totalWithdrawn: 20000 },
};

let session = null;
const txs = [
  { id: 't1', uid: 'p1', amount: 50000, operator: 'TMONEY', reference: 'RET-1014-44710', status: 'pending_review', createdAt: ago(4) },
  { id: 't2', uid: 'p2', amount: 120000, operator: 'FLOOZ', reference: 'RET-1014-44522', status: 'pending_review', createdAt: ago(19) },
  { id: 't3', uid: 'p3', amount: 35000, operator: 'TMONEY', reference: 'RET-1014-44310', status: 'pending_review', createdAt: ago(31) },
  { id: 't4', uid: 'p4', amount: 28000, operator: 'FLOOZ', reference: 'RET-1014-43987', status: 'pending_review', createdAt: ago(57) },
  { id: 't5', uid: 'p1', amount: 15000, operator: 'TMONEY', reference: 'RET-1013-41005', status: 'success', createdAt: ago(900), review: { byEmail: 'finance@wynveo.com', decision: 'approve' } },
].map((t) => ({ type: 'withdrawal', msisdn: players[t.uid].phone, failureReason: null, review: null, ...t }));

const withPlayer = (t) => ({ ...t, player: players[t.uid] });
const sub = (fn) => { listeners.add(fn); fn(); return () => listeners.delete(fn); };

export const adminAuthService = {
  onAuthChange(cb) { return sub(() => cb(session)); },
  async signIn(email, password) {
    await delay();
    if (email !== 'admin@wynveo.com' || password !== 'demo1234') throw new AppError('auth/invalid-credential', 'E-mail ou mot de passe incorrect.');
    session = { uid: 'a1', email, role: 'super' };
    emit();
  },
  async signOut() { session = null; emit(); },
};

export const withdrawalAdminService = {
  watchPending(cb) {
    return sub(() => cb(txs.filter((t) => t.status === 'pending_review').sort((a, b) => a.createdAt - b.createdAt).map(withPlayer)));
  },
  watchRecent(cb, _e, limit = 15) {
    return sub(() => cb([...txs].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit).map(withPlayer)));
  },
  async review({ txId, decision, reason }) {
    await delay(600);
    const t = txs.find((x) => x.id === txId);
    if (!t || t.status !== 'pending_review') throw new AppError('ALREADY_REVIEWED', 'Ce retrait a déjà été traité.');
    if (decision === 'reject' && !String(reason ?? '').trim()) throw new AppError('INVALID_ARGUMENT', 'Indiquez le motif du refus : il sera envoyé au joueur.');
    t.status = decision === 'approve' ? 'success' : 'rejected';
    t.review = { byEmail: session?.email, decision, reason: reason ?? null };
    if (decision === 'reject') t.failureReason = reason;
    emit();
    return { status: t.status };
  },
};
