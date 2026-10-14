import { useEffect, useMemo, useState } from 'react';
import { matchesHistoryFilter, HISTORY_FILTERS } from '@wynveo/core';
import { walletService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function dayLabel(date, now = new Date()) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const t = new Date(now); t.setHours(0, 0, 0, 0);
  const diff = Math.round((t - d) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return DAY_FMT.format(date);
}

/** Opérations du joueur, filtrées et groupées par jour. */
export function useTransactions({ limit = 50, filter = 'all' } = {}) {
  const { user } = useSession();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    return walletService.watchTransactions(user.uid, { limit }, setItems, setError);
  }, [user, limit]);

  const groups = useMemo(() => {
    if (!items) return [];
    const out = [];
    for (const tx of items.filter((t) => matchesHistoryFilter(t, filter))) {
      const label = dayLabel(tx.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(tx);
      else out.push({ label, items: [tx] });
    }
    return out;
  }, [items, filter]);

  return { loading: items === null && !error, error, groups, items: items ?? [], filters: HISTORY_FILTERS };
}
