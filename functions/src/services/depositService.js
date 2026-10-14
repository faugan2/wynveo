import { HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue } from '../lib/firebase.js';
import { assertRule, badRequest } from '../lib/guards.js';
import { getPaymentProvider } from '../payments/index.js';
import { walletRef, txRef, newTxRef, walletFromDoc, walletUpdate, newTransaction } from '../repositories/index.js';
import { getActivePlayer } from './profileService.js';
import {
  validateDepositAmount, normalizeTogoPhone, isOperator, applyDeposit, makeReference, REF_PREFIX,
  TX_TYPE, TX_STATUS, dayKey,
} from '../core/index.js';

/** Le joueur demande un dépôt : on enregistre l'opération puis on sollicite l'opérateur. */
export async function startDeposit(uid, input) {
  const amount = input?.amount;
  assertRule(validateDepositAmount(amount));
  if (!isOperator(input?.operator)) throw badRequest('Choisissez un moyen de paiement.', 'OPERATOR_INVALID');
  const msisdn = assertRule(normalizeTogoPhone(input?.msisdn)).e164;
  await getActivePlayer(uid);

  const provider = getPaymentProvider();
  const ref = newTxRef();
  const reference = makeReference(REF_PREFIX.deposit);
  await ref.set(newTransaction({
    uid, type: TX_TYPE.DEPOSIT, status: TX_STATUS.PENDING, amount, reference,
    operator: input.operator, msisdn, provider: provider.id, dayKey: dayKey(),
  }));

  let result;
  try {
    result = await provider.initiateCollection({ amount, msisdn, operator: input.operator, reference });
  } catch (err) {
    await settleDeposit(ref.id, { status: 'failed', reason: "L'opérateur ne répond pas. Réessayez dans un instant." });
    throw new HttpsError('unavailable', "L'opérateur ne répond pas. Réessayez dans un instant.");
  }
  await ref.update({ providerRef: result.providerRef ?? null });
  if (result.status !== 'pending') await settleDeposit(ref.id, result);

  const final = (await ref.get()).data();
  return { txId: ref.id, reference, status: final.status, allowsManualConfirmation: provider.allowsManualConfirmation };
}

/**
 * Applique la réponse de l'opérateur (webhook, ou bouton en simulation).
 * Idempotent : une opération déjà terminée n'est jamais créditée deux fois.
 */
export async function settleDeposit(txId, outcome) {
  return db.runTransaction(async (t) => {
    const txSnap = await t.get(txRef(txId));
    if (!txSnap.exists) throw new HttpsError('not-found', 'Opération introuvable.');
    const tx = txSnap.data();
    if (tx.type !== TX_TYPE.DEPOSIT) throw new HttpsError('failed-precondition', "Ce n'est pas un dépôt.");
    if (tx.status !== TX_STATUS.PENDING) return { status: tx.status, alreadySettled: true };

    if (outcome.status !== 'success') {
      t.update(txSnap.ref, { status: TX_STATUS.FAILED, failureReason: outcome.reason ?? 'Paiement non confirmé.', updatedAt: FieldValue.serverTimestamp() });
      return { status: TX_STATUS.FAILED };
    }

    const wSnap = await t.get(walletRef(tx.uid));
    const { wallet, bonus } = applyDeposit(walletFromDoc(wSnap), tx.amount);
    t.set(wSnap.ref, walletUpdate(wallet), { merge: true });
    t.update(txSnap.ref, {
      status: TX_STATUS.SUCCESS,
      providerRef: outcome.providerRef ?? tx.providerRef,
      balanceAfter: wallet.balance,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (bonus.amount > 0) {
      t.set(newTxRef(), newTransaction({
        uid: tx.uid, type: TX_TYPE.BONUS, status: TX_STATUS.SUCCESS, amount: bonus.amount,
        reference: makeReference(REF_PREFIX.bonus), dayKey: dayKey(),
        label: 'Bonus de bienvenue', wagerRequired: bonus.wagerRequired, relatedTx: txId,
      }));
    }
    return { status: TX_STATUS.SUCCESS, bonus: bonus.amount, balance: wallet.balance };
  });
}

/** Simulation uniquement : le joueur « confirme sur son téléphone » depuis l'application. */
export async function confirmSimulatedDeposit(uid, txId) {
  const provider = getPaymentProvider();
  if (!provider.allowsManualConfirmation) throw new HttpsError('permission-denied', 'Confirmation manuelle désactivée.');
  const snap = await txRef(txId).get();
  if (!snap.exists || snap.data().uid !== uid) throw new HttpsError('not-found', 'Opération introuvable.');
  return settleDeposit(txId, { status: 'success' });
}

/** Le joueur abandonne un dépôt encore en attente. */
export async function cancelDeposit(uid, txId) {
  const snap = await txRef(txId).get();
  if (!snap.exists || snap.data().uid !== uid) throw new HttpsError('not-found', 'Opération introuvable.');
  return settleDeposit(txId, { status: 'failed', reason: 'Annulé par le joueur.' });
}
