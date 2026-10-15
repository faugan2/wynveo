import { useEffect, useMemo, useState } from 'react';
import { userAdminService } from '../services/index.js';

const KYC_LABEL = { none: 'Aucun', pending: 'En attente', verified: 'Vérifié', rejected: 'Refusé' };
const STATUS_LABEL = { active: 'Actif', suspended: 'Suspendu' };

/**
 * Liste des joueurs avec filtres et recherche.
 * Champs : uid, fullName, phone, status, kycStatus, totalDeposited/Withdrawn, gameStaked/Won, sportStaked/Won.
 */
export function useAdminUsers() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [kycFilter, setKycFilter] = useState(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await userAdminService.listUsers({ search, statusFilter, kycFilter, limit: 100 });
        setItems(res);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [search, statusFilter, kycFilter]);

  return {
    items: items ?? [],
    loading: items === null && !error,
    error,
    search, setSearch,
    statusFilter, setStatusFilter,
    kycFilter, setKycFilter,
    KYC_LABEL, STATUS_LABEL,
  };
}

/** Détail d'un joueur seul. */
export function useAdminUser(uid) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const u = await userAdminService.getUser(uid);
        setUser(u);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [uid]);
  return { user, loading: user === null && !error, error };
}

/** Actions sur les utilisateurs. */
export function useUserActions() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const run = (key, fn) => async (...args) => {
    setBusy(key);
    setError(null);
    try {
      return await fn(...args);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(null);
    }
  };
  return {
    busy, error, clear: () => setError(null),
    suspend: run('suspend', (uid) => userAdminService.setSuspended(uid, true)),
    resume: run('resume', (uid) => userAdminService.setSuspended(uid, false)),
    resetPassword: run('reset-pw', (uid) => userAdminService.resetPassword(uid)),
  };
}

/** Détail utilisateur avec historique des transactions. */
export function useUserDetail(uid) {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, txs] = await Promise.all([
          userAdminService.getUser(uid),
          userAdminService.getUserTransactions(uid, 50),
        ]);
        setUser(u);
        setTransactions(txs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  return { user, transactions, loading, error, KYC_LABEL, STATUS_LABEL };
}
