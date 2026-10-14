/**
 * Choix du prestataire de paiement.
 *
 * Contrat que tout prestataire doit respecter :
 *   id: string
 *   allowsManualConfirmation: boolean
 *   initiateCollection({ amount, msisdn, operator, reference }) -> { providerRef, status: 'pending'|'success'|'failed', reason? }
 *   initiatePayout({ amount, msisdn, operator, reference })    -> { providerRef, status: 'success'|'pending'|'failed', reason? }
 *   parseWebhook(req) -> { reference, status: 'success'|'failed', providerRef, reason? }
 *
 * Pour brancher CinetPay ou FedaPay : créer ./cinetpayProvider.js avec ces
 * méthodes, l'ajouter ci-dessous et définir PAYMENT_PROVIDER=cinetpay.
 * Les services (dépôt, retrait) et l'application n'ont pas à changer.
 */
import { simulatedProvider } from './simulatedProvider.js';

const providers = {
  simulated: simulatedProvider,
};

export function getPaymentProvider() {
  const id = process.env.PAYMENT_PROVIDER || 'simulated';
  const provider = providers[id];
  if (!provider) throw new Error(`Prestataire de paiement inconnu : ${id}`);
  return provider;
}
