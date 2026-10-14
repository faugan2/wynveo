/**
 * Accès aux documents Firestore. Les services métier passent par ici
 * pour ne pas répéter les chemins et le format des documents.
 */
import { db, COL, FieldValue } from '../lib/firebase.js';

export const userRef = (uid) => db.collection(COL.USERS).doc(uid);
export const walletRef = (uid) => db.collection(COL.WALLETS).doc(uid);
export const txRef = (id) => db.collection(COL.TRANSACTIONS).doc(id);
export const newTxRef = () => db.collection(COL.TRANSACTIONS).doc();
export const referralRef = (code) => db.collection(COL.REFERRAL_CODES).doc(code);
export const betRef = (id) => db.collection(COL.BETS).doc(id);
export const newBetRef = () => db.collection(COL.BETS).doc();
export const lnDrawRef = (id) => db.collection(COL.LN_DRAWS).doc(id);
export const jackpotRoundRef = (id) => db.collection(COL.JACKPOT_ROUNDS).doc(id);

/** Ne garde que les champs du portefeuille que le core manipule. */
export function walletFromDoc(snap) {
  const d = snap.data() ?? {};
  return {
    balance: d.balance ?? 0,
    bonusBalance: d.bonusBalance ?? 0,
    bonusWagerRemaining: d.bonusWagerRemaining ?? 0,
    totalDeposited: d.totalDeposited ?? 0,
    totalWithdrawn: d.totalWithdrawn ?? 0,
    depositCount: d.depositCount ?? 0,
    // anciens portefeuilles : un dépôt existant vaut bonus déjà attribué
    welcomeBonusGranted: d.welcomeBonusGranted ?? (d.depositCount ?? 0) > 0,
    totalStaked: d.totalStaked ?? 0,
    totalWon: d.totalWon ?? 0,
    withdrawnToday: d.withdrawnToday ?? { date: null, amount: 0 },
  };
}

export function walletUpdate(wallet) {
  return { ...wallet, updatedAt: FieldValue.serverTimestamp() };
}

/** Champs communs à toute opération. */
export function newTransaction(fields) {
  return {
    product: null,
    operator: null,
    msisdn: null,
    provider: null,
    providerRef: null,
    balanceAfter: null,
    failureReason: null,
    ...fields,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function logAdminAction(t, { adminUid, adminEmail, action, target, details }) {
  const ref = db.collection(COL.ADMIN_LOGS).doc();
  t.set(ref, { adminUid, adminEmail, action, target, details: details ?? null, at: FieldValue.serverTimestamp() });
}
