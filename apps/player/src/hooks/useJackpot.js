/** Jackpot quotidien : cagnotte du jour en direct, achat de tickets, derniers gagnants. */
import { useEffect, useMemo, useState } from 'react';
import { JACKPOT, displayBalance, jackpotRoundFor, formatFCFA } from '@wynveo/core';
import { gamesService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useAsyncAction } from './useAsyncAction.js';
import { useNow, remaining } from './useNow.js';

export function useJackpot() {
  const { user, wallet, heldBalance } = useSession();
  const now = useNow();
  const { roundId, drawAt } = jackpotRoundFor(now);
  const [round, setRound] = useState(null);
  const [winners, setWinners] = useState([]);
  const [bets, setBets] = useState([]);
  const [tickets, setTickets] = useState(JACKPOT.quickTickets[0]);
  const [confirmation, setConfirmation] = useState(null);
  const action = useAsyncAction(gamesService.buyJackpot);

  useEffect(() => gamesService.watchJackpotRound(roundId, setRound), [roundId]);
  useEffect(() => gamesService.watchJackpotWinners(setWinners), []);
  useEffect(() => gamesService.watchBets(user.uid, { limit: 50 }, setBets), [user.uid]);

  const myTickets = useMemo(
    () => bets.filter((b) => b.roundId === roundId).reduce((s, b) => s + (b.tickets ?? 0), 0),
    [bets, roundId],
  );
  const totalTickets = round?.ticketCount ?? 0;

  async function buy() {
    const res = await action.run({ tickets });
    if (res) setConfirmation(res);
  }

  return {
    config: JACKPOT,
    balance: heldBalance ?? displayBalance(wallet),
    roundId, drawAt, countdown: remaining(drawAt, now),
    pool: round?.pool ?? JACKPOT.seed,
    totalTickets, players: round?.purchaseCount ?? 0,
    myTickets,
    chances: myTickets ? `${myTickets} ticket${myTickets > 1 ? 's' : ''} sur ${totalTickets}` : null,
    tickets, setTickets: (n) => { setTickets(Math.max(1, Math.min(JACKPOT.maxTicketsPerPurchase, n))); action.clearError(); },
    cost: tickets * JACKPOT.ticketPrice,
    costLabel: formatFCFA(tickets * JACKPOT.ticketPrice),
    buy, pending: action.pending, error: action.error,
    confirmation, dismiss: () => setConfirmation(null),
    winners,
    demo: gamesService.demo,
  };
}
