/**
 * Point d'entrée des notifications du prestataire de paiement (webhook).
 * Inactif avec le prestataire simulé ; prêt pour CinetPay / FedaPay.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db, COL } from '../lib/firebase.js';
import { getPaymentProvider } from '../payments/index.js';
import { settleDeposit } from '../services/depositService.js';
import { finalizeWithdrawal } from '../services/withdrawalService.js';

export const paymentWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const event = await getPaymentProvider().parseWebhook(req);
    const snap = await db.collection(COL.TRANSACTIONS).where('reference', '==', event.reference).limit(1).get();
    if (snap.empty) return res.status(404).send('Unknown reference');
    const tx = snap.docs[0];
    if (tx.data().type === 'deposit') await settleDeposit(tx.id, event);
    else await finalizeWithdrawal(tx.id, event);
    return res.status(200).send('OK');
  } catch (err) {
    logger.warn('Webhook rejeté', { message: err.message });
    return res.status(400).send('Bad Request');
  }
});
