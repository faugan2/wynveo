/** Lucky Number : choisir 5 numéros, payer le ticket, suivre le prochain tirage et les résultats. */
import { useEffect, useMemo, useState } from 'react';
import {
  LUCKY_NUMBER, displayBalance, ticketDrawSlot, validateNumbers, drawDistinct, weakRng, luckyNumberWin,
} from '@wynveo/core';
import { gamesService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useStake } from './useStake.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useNow, remaining } from './useNow.js';

export function useLuckyNumber() {
  const { user, wallet, heldBalance } = useSession();
  const config = gamesService.config.luckyNumber;
  const stake = useStake(LUCKY_NUMBER, 1000);
  const now = useNow();
  const [picks, setPicks] = useState([]);
  const [lastTicket, setLastTicket] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [recentDraws, setRecentDraws] = useState([]);
  const [bets, setBets] = useState([]);
  const action = useAsyncAction(gamesService.buyNumbers);

  const slot = ticketDrawSlot(now, config);
  useEffect(() => gamesService.watchMyTickets(user.uid, slot.drawId, setMyTickets), [user.uid, slot.drawId]);
  useEffect(() => gamesService.watchRecentDraws(setRecentDraws), []);
  useEffect(() => gamesService.watchBets(user.uid, { limit: 30 }, setBets), [user.uid]);

  const myResults = useMemo(
    () => bets.filter((b) => b.game === 'lucky_number' && b.status !== 'pending').slice(0, 5),
    [bets],
  );

  function toggle(n) {
    action.clearError();
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < config.pick ? [...p, n] : p));
  }

  async function buy() {
    const check = validateNumbers(picks, config);
    if (!check.ok) { action.setError(check.message); return; }
    const res = await action.run({ stake: stake.stake, numbers: check.value });
    if (res) setLastTicket(res);
  }

  return {
    config, stake, balance: heldBalance ?? displayBalance(wallet),
    picks: [...picks].sort((a, b) => a - b),
    toggle, clear: () => setPicks([]), quickPick: () => setPicks(drawDistinct(config.pick, config.maxNumber, weakRng)),
    full: picks.length === config.pick,
    nextDraw: slot, countdown: remaining(slot.drawAt, now),
    payTable: Object.entries(config.payTable).map(([k, m]) => ({ matches: Number(k), multiplier: m, example: luckyNumberWin(stake.stake, Number(k), config).win })),
    buy, pending: action.pending, error: action.error, lastTicket, dismissTicket: () => setLastTicket(null),
    myTickets, recentDraws, myResults,
    demo: gamesService.demo,
  };
}
