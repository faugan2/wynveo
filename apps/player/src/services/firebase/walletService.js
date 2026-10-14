import { db, functions } from '../../config/firebase.js';
import { wrap, toAppError } from '../errors.js';
import { mapWallet, mapTransaction } from './mappers.js';

const call = (name) => async (data) => (await functions.httpsCallable(name)(data)).data;

export const walletService = {
  watchWallet(uid, cb, onError) {
    return db.collection('wallets').doc(uid).onSnapshot(
      (snap) => cb(mapWallet(snap)),
      (err) => onError?.(toAppError(err)),
    );
  },

  /** cb(transactions[]) triées de la plus récente à la plus ancienne. */
  watchTransactions(uid, { limit = 50 } = {}, cb, onError) {
    return db.collection('transactions')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(
        (snap) => cb(snap.docs.map(mapTransaction)),
        (err) => onError?.(toAppError(err)),
      );
  },

  watchTransaction(txId, cb, onError) {
    return db.collection('transactions').doc(txId).onSnapshot(
      (snap) => snap.exists && cb(mapTransaction(snap)),
      (err) => onError?.(toAppError(err)),
    );
  },

  /** -> { txId, reference, status, allowsManualConfirmation } */
  createDeposit: wrap(call('walletCreateDeposit')),
  /** Simulation : remplace la confirmation sur le téléphone. -> { status, bonus, balance } */
  confirmSimulatedDeposit: wrap((txId) => call('walletConfirmSimulatedDeposit')({ txId })),
  cancelDeposit: wrap((txId) => call('walletCancelDeposit')({ txId })),
  /** -> { txId, reference, status } */
  requestWithdrawal: wrap(call('walletRequestWithdrawal')),
};
