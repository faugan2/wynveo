/** Types d'opérations enregistrées dans `transactions`. */
export const TX_TYPE = Object.freeze({
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  BONUS: 'bonus',
  BET: 'bet',
  WIN: 'win',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
  BONUS_UNLOCK: 'bonus_unlock',
});

/** Cycle de vie d'une opération. */
export const TX_STATUS = Object.freeze({
  /** Dépôt : en attente de confirmation sur le téléphone du joueur. */
  PENDING: 'pending',
  /** Retrait : en attente de validation par un admin. */
  PENDING_REVIEW: 'pending_review',
  /** Retrait : validé, envoi en cours chez l'opérateur. */
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REJECTED: 'rejected',
});

export const TX_TYPE_LABEL = Object.freeze({
  deposit: 'Dépôt',
  withdrawal: 'Retrait',
  bonus: 'Bonus',
  bet: 'Mise',
  win: 'Gain',
  bonus_unlock: 'Bonus débloqué',
  refund: 'Remboursement',
  adjustment: 'Ajustement',
});

export const TX_STATUS_LABEL = Object.freeze({
  pending: 'En attente',
  pending_review: 'En validation',
  processing: 'En cours',
  success: 'Réussi',
  failed: 'Échoué',
  rejected: 'Refusé',
});

/** Ton visuel associé à un statut : 'good' | 'warn' | 'bad' | 'info'. */
export function statusTone(status) {
  switch (status) {
    case TX_STATUS.SUCCESS: return 'good';
    case TX_STATUS.FAILED:
    case TX_STATUS.REJECTED: return 'bad';
    case TX_STATUS.PENDING:
    case TX_STATUS.PENDING_REVIEW:
    case TX_STATUS.PROCESSING: return 'warn';
    default: return 'info';
  }
}

/** Montant signé vu du joueur : un retrait ou une mise diminue le solde. */
export function signedAmount(tx) {
  const outgoing = tx.type === TX_TYPE.WITHDRAWAL || tx.type === TX_TYPE.BET;
  if (tx.type === TX_TYPE.ADJUSTMENT) return tx.amount;
  if (tx.type === TX_TYPE.BONUS_UNLOCK) return 0;
  return outgoing ? -Math.abs(tx.amount) : Math.abs(tx.amount);
}

/** Filtres de l'écran Historique. */
export const HISTORY_FILTERS = Object.freeze([
  { id: 'all', label: 'Tout', types: null },
  { id: 'deposits', label: 'Dépôts', types: [TX_TYPE.DEPOSIT, TX_TYPE.BONUS, TX_TYPE.BONUS_UNLOCK] },
  { id: 'withdrawals', label: 'Retraits', types: [TX_TYPE.WITHDRAWAL] },
  { id: 'games', label: 'Jeux', types: [TX_TYPE.BET, TX_TYPE.WIN], product: 'games' },
  { id: 'sport', label: 'Sport', types: [TX_TYPE.BET, TX_TYPE.WIN], product: 'sport' },
]);

export function matchesHistoryFilter(tx, filterId) {
  const f = HISTORY_FILTERS.find((x) => x.id === filterId);
  if (!f || !f.types) return true;
  if (!f.types.includes(tx.type)) return false;
  return f.product ? tx.product === f.product : true;
}
