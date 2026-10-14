import { HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue } from '../lib/firebase.js';
import { assertRule, badRequest } from '../lib/guards.js';
import { getPaymentProvider } from '../payments/index.js';
import { walletRef, txRef, newTxRef, walletFromDoc, walletUpdate, newTransaction, logAdminAction } from '../repositories/index.js';
import { getActivePlayer } from './profileService.js';
import {
  validateWithdrawal, withdrawalReviewMode, applyWithdrawalHold, applyWithdrawalRefund, applyWithdrawalPaid,
  isOperator, makeReference, REF_PREFIX, TX_TYPE, TX_STATUS, dayKey,
} from '../core/index.js';

/**
 * Le joueur demande un retrait. Par sécurité, l'argent part uniquement vers
 * le numéro du compte (celui vérifié par SMS) : un compte volé ne peut pas
 * être vidé vers un autre numéro.
 */
export async function requestWithdrawal(uid, input) {
  const amount = input?.amount;
  if (!isOperator(input?.operator)) throw badRequest('Choisissez un moyen de paiement.', 'OPERATOR_INVALID');
  const today = dayKey();

  const created = await db.runTransaction(async (t) => {
    const user = await getActivePlayer(uid, t);
    const wSnap = await t.get(walletRef(uid));
    const wallet = walletFromDoc(wSnap);
    assertRule(validateWithdrawal({ amount, wallet, kycStatus: user.kycStatus, today, phoneVerified: user.phoneVerified }));

    const mode = withdrawalReviewMode({ amount, kycStatus: user.kycStatus });
    const next = applyWithdrawalHold(wallet, amount, today);
    const ref = newTxRef();
    const reference = makeReference(REF_PREFIX.withdrawal);
    t.set(wSnap.ref, walletUpdate(next), { merge: true });
    t.set(ref, newTransaction({
      uid, type: TX_TYPE.WITHDRAWAL, amount, reference, dayKey: today,
      status: mode === 'auto' ? TX_STATUS.PROCESSING : TX_STATUS.PENDING_REVIEW,
      operator: input.operator, msisdn: user.phone, provider: getPaymentProvider().id,
      balanceAfter: next.balance, reviewMode: mode,
    }));
    return { txId: ref.id, reference, mode };
  });

  if (created.mode === 'auto') await processPayout(created.txId);
  const final = (await txRef(created.txId).get()).data();
  return { txId: created.txId, reference: created.reference, status: final.status };
}

/** Envoie l'argent via l'opérateur puis clôt l'opération (payée, ou échouée et remboursée). */
export async function processPayout(txId) {
  const tx = (await txRef(txId).get()).data();
  if (tx.status !== TX_STATUS.PROCESSING) return;

  let result;
  try {
    result = await getPaymentProvider().initiatePayout({ amount: tx.amount, msisdn: tx.msisdn, operator: tx.operator, reference: tx.reference });
  } catch {
    result = { status: 'pending' }; // on ne sait pas : on laisse "en cours", un admin vérifiera
  }
  if (result.status === 'pending') {
    await txRef(txId).update({ providerRef: result.providerRef ?? null, updatedAt: FieldValue.serverTimestamp() });
    return;
  }
  await finalizeWithdrawal(txId, result);
}

/** Clôture idempotente d'un retrait en cours. */
export async function finalizeWithdrawal(txId, outcome) {
  const today = dayKey();
  return db.runTransaction(async (t) => {
    const txSnap = await t.get(txRef(txId));
    const tx = txSnap.data();
    if (tx.status !== TX_STATUS.PROCESSING) return { status: tx.status };
    const wSnap = await t.get(walletRef(tx.uid));
    const wallet = walletFromDoc(wSnap);
    if (outcome.status === 'success') {
      t.set(wSnap.ref, walletUpdate(applyWithdrawalPaid(wallet, tx.amount)), { merge: true });
      t.update(txSnap.ref, { status: TX_STATUS.SUCCESS, providerRef: outcome.providerRef ?? null, updatedAt: FieldValue.serverTimestamp() });
      return { status: TX_STATUS.SUCCESS };
    }
    const refunded = applyWithdrawalRefund(wallet, tx.amount, tx.dayKey, today);
    t.set(wSnap.ref, walletUpdate(refunded), { merge: true });
    t.update(txSnap.ref, {
      status: TX_STATUS.FAILED, failureReason: outcome.reason ?? "Échec chez l'opérateur, montant remboursé.",
      providerRef: outcome.providerRef ?? null, balanceAfter: refunded.balance, updatedAt: FieldValue.serverTimestamp(),
    });
    return { status: TX_STATUS.FAILED };
  });
}

/** Décision d'un admin sur un retrait en attente. */
export async function reviewWithdrawal(admin, { txId, decision, reason }) {
  if (!['approve', 'reject'].includes(decision)) throw badRequest('Décision invalide.');
  if (decision === 'reject' && !String(reason ?? '').trim()) throw badRequest('Indiquez le motif du refus : il sera envoyé au joueur.');
  const today = dayKey();

  await db.runTransaction(async (t) => {
    const txSnap = await t.get(txRef(txId));
    if (!txSnap.exists) throw new HttpsError('not-found', 'Retrait introuvable.');
    const tx = txSnap.data();
    if (tx.type !== TX_TYPE.WITHDRAWAL || tx.status !== TX_STATUS.PENDING_REVIEW) {
      throw new HttpsError('failed-precondition', 'Ce retrait a déjà été traité.', { code: 'ALREADY_REVIEWED' });
    }
    const review = { by: admin.uid, byEmail: admin.email, at: new Date(), decision, reason: reason ?? null };
    if (decision === 'approve') {
      t.update(txSnap.ref, { status: TX_STATUS.PROCESSING, review, updatedAt: FieldValue.serverTimestamp() });
    } else {
      const wSnap = await t.get(walletRef(tx.uid));
      const refunded = applyWithdrawalRefund(walletFromDoc(wSnap), tx.amount, tx.dayKey, today);
      t.set(wSnap.ref, walletUpdate(refunded), { merge: true });
      t.update(txSnap.ref, { status: TX_STATUS.REJECTED, review, failureReason: reason, balanceAfter: refunded.balance, updatedAt: FieldValue.serverTimestamp() });
    }
    logAdminAction(t, {
      adminUid: admin.uid, adminEmail: admin.email,
      action: decision === 'approve' ? 'withdrawal.approve' : 'withdrawal.reject',
      target: { type: 'transaction', id: txId, uid: tx.uid, amount: tx.amount, reference: tx.reference },
      details: reason ? { reason } : null,
    });
  });

  if (decision === 'approve') await processPayout(txId);
  return { status: (await txRef(txId).get()).data().status };
}
