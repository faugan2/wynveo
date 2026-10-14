import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) initializeApp();

export const db = getFirestore();
export const adminAuth = getAuth();
export { FieldValue, Timestamp };

/** Noms des collections, au même endroit pour les fonctions et les règles. */
export const COL = Object.freeze({
  USERS: 'users',
  WALLETS: 'wallets',
  TRANSACTIONS: 'transactions',
  ADMIN_LOGS: 'adminLogs',
  REFERRAL_CODES: 'referralCodes',
});
