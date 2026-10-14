import { useEffect, useMemo, useState } from 'react';
import { gamesService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';

/** Paris du joueur (jeux ou sport) avec un petit bilan. */
export function useMyBets({ product = 'games', limit = 100 } = {}) {
  const { user } = useSession();
  const [bets, setBets] = useState(null);
  useEffect(() => gamesService.watchBets(user.uid, { limit }, setBets), [user.uid, limit]);
  const items = useMemo(() => (bets ?? []).filter((b) => (b.product ?? 'games') === product), [bets, product]);
  const summary = useMemo(() => {
    const staked = items.reduce((s, b) => s + b.stake, 0);
    const won = items.reduce((s, b) => s + (b.win ?? 0), 0);
    const pending = items.filter((b) => b.status === 'pending');
    // pendingStake : mises pas encore réglées, à exclure du bilan des tickets terminés.
    return { staked, won, net: won - staked, pending: pending.length, pendingStake: pending.reduce((s, b) => s + b.stake, 0) };
  }, [items]);
  return { loading: bets === null, items, summary };
}
