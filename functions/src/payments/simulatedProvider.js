/**
 * Prestataire de paiement simulé.
 * Il imite un vrai prestataire Mobile Money (CinetPay, FedaPay…) :
 * - collect : le joueur doit confirmer sur son téléphone, le dépôt reste "pending" ;
 *   en simulation, l'application affiche un bouton qui joue ce rôle.
 * - payout : l'envoi d'argent au joueur réussit immédiatement,
 *   sauf pour les numéros finissant par 0000 (pour tester un échec).
 *
 * Tout vrai prestataire doit exposer les mêmes méthodes (voir ./index.js).
 */
let counter = 0;
const ref = (p) => `SIM-${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`.toUpperCase();

export const simulatedProvider = {
  id: 'simulated',
  /** L'application peut-elle confirmer elle-même un dépôt ? (vrai uniquement ici) */
  allowsManualConfirmation: true,

  async initiateCollection({ amount, msisdn, operator, reference }) {
    return { providerRef: ref('COL'), status: 'pending', message: `Demande de ${amount} FCFA envoyée au ${msisdn} (${operator}) · ${reference}` };
  },

  async initiatePayout({ msisdn }) {
    if (String(msisdn).endsWith('0000')) {
      return { providerRef: ref('PAY'), status: 'failed', reason: "Numéro refusé par l'opérateur (simulation)." };
    }
    return { providerRef: ref('PAY'), status: 'success' };
  },

  /** Un vrai prestataire vérifie ici la signature du webhook. */
  async parseWebhook() {
    throw new Error("Le prestataire simulé n'envoie pas de webhook.");
  },
};
