import { useEffect, useMemo, useState } from 'react';
import { withdrawableAmount, WITHDRAWAL_LIMITS } from '@wynveo/core';
import { withdrawalAdminService } from '../services/index.js';

/**
 * Signaux de risque affichés à côté d'un retrait.
 * Purement informatifs : la décision reste celle de l'admin.
 */
export function riskFlags(tx) {
  const p = tx.player ?? {};
  const flags = [];
  if (p.kycStatus !== 'verified' && tx.amount > WITHDRAWAL_LIMITS.autoApproveMax) flags.push({ tone: 'bad', label: 'KYC non vérifié' });
  if (tx.amount >= 100_000) flags.push({ tone: 'warn', label: 'Gros montant' });
  if ((p.totalWithdrawn ?? 0) + tx.amount > (p.totalDeposited ?? 0) * 1.5) flags.push({ tone: 'warn', label: 'Retraits > dépôts' });
  if (p.status !== 'active') flags.push({ tone: 'bad', label: 'Compte suspendu' });
  return flags.length ? flags : [{ tone: 'good', label: 'Aucun signal' }];
}

export function usePendingWithdrawals({ enabled = true } = {}) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => (enabled ? withdrawalAdminService.watchPending(setItems, setError) : undefined), [enabled]);
  const total = useMemo(() => (items ?? []).reduce((s, t) => s + t.amount, 0), [items]);
  return { items: items ?? [], loading: items === null && !error, error, total };
}

export function useRecentWithdrawals(limit = 10) {
  const [items, setItems] = useState(null);
  useEffect(() => withdrawalAdminService.watchRecent(setItems, undefined, limit), [limit]);
  return { items: items ?? [], loading: items === null };
}

/** Décision sur un retrait : approve(), ou reject() avec un motif obligatoire. */
export function useReviewWithdrawal() {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  async function review(txId, decision, reason) {
    setBusyId(txId); setError(null);
    try {
      return await withdrawalAdminService.review({ txId, decision, reason });
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusyId(null);
    }
  }
  return { review, busyId, error, clearError: () => setError(null) };
}

export { withdrawableAmount };
