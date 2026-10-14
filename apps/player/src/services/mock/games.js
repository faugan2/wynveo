/**
 * Jeux en mode démo : mêmes règles que le serveur (@wynveo/core), exécutées
 * dans le navigateur. Lucky Number tire toutes les 2 minutes pour la démo ;
 * le Jackpot peut être tiré à la demande.
 */
import {
  GAME, GAME_LABEL, LUCKY_SPIN, MYSTERY_BOX, LUCKY_NUMBER, JACKPOT, TX_TYPE, TX_STATUS,
  validateStake, spinWheel, validateBoxChoice, openBoxes, validateNumbers, ticketDrawSlot, drawNumbers, countMatches,
  luckyNumberWin, validateTicketCount, jackpotRoundFor, jackpotPoolAfter, pickJackpotWinner, applyStake, applySettlement,
  winAmount, makeReference, weakRng,
} from '@wynveo/core';
import { AppError } from '../errors.js';
import { state, commit, subscribe, delay, newId } from './store.js';

const LN_DEMO = { ...LUCKY_NUMBER, intervalMinutes: 2, closeBeforeSeconds: 10 };
const PREFIX = { lucky_spin: 'SP', mystery_box: 'MB', lucky_number: 'LN', jackpot: 'JP' };
const assertRule = (r) => { if (!r.ok) throw new AppError(r.code, r.message); return r; };

function me() {
  if (!state.session) throw new AppError('unauthenticated', 'Connectez-vous pour continuer.');
  const uid = state.session.uid;
  const user = state.users[uid];
  if (!user) throw new AppError('PROFILE_MISSING', 'Terminez votre inscription.');
  return { uid, user };
}

function addTx(fields) {
  state.transactions.unshift({ id: newId(), operator: null, msisdn: null, failureReason: null, createdAt: new Date(), updatedAt: new Date(), ...fields });
}

function stake(uid, game, amount, fields = {}) {
  const res = assertRule(applyStake(state.wallets[uid], amount));
  state.wallets[uid] = res.wallet;
  const bet = {
    id: newId(), uid, product: 'games', game, stake: amount, split: res.split, reference: makeReference(PREFIX[game]),
    status: 'pending', multiplier: null, win: 0, outcome: null, createdAt: new Date(), settledAt: null, ...fields,
  };
  state.bets.unshift(bet);
  addTx({ uid, type: TX_TYPE.BET, status: TX_STATUS.SUCCESS, amount, product: 'games', game, reference: bet.reference, label: `Mise ${GAME_LABEL[game]}`, balanceAfter: res.wallet.balance });
  return bet;
}

function settle(bet, multiplier, win, outcome) {
  const res = applySettlement(state.wallets[bet.uid], { stake: bet.stake, split: bet.split, win });
  state.wallets[bet.uid] = res.wallet;
  Object.assign(bet, { status: win > 0 ? 'won' : 'lost', multiplier, win, outcome, settledAt: new Date() });
  if (win > 0) addTx({ uid: bet.uid, type: TX_TYPE.WIN, status: TX_STATUS.SUCCESS, amount: win, product: 'games', game: bet.game, reference: bet.reference, label: `Gain ${GAME_LABEL[bet.game]}`, balanceAfter: res.wallet.balance });
  if (res.converted > 0) addTx({ uid: bet.uid, type: TX_TYPE.BONUS_UNLOCK, status: TX_STATUS.SUCCESS, amount: res.converted, reference: bet.reference, label: 'Bonus débloqué : devenu retirable' });
  return res;
}

function playInstant(game, amount, config, draw) {
  const { uid } = me();
  assertRule(validateStake(amount, config));
  const bet = stake(uid, game, amount);
  const { multiplier, outcome } = draw();
  const win = winAmount(amount, multiplier);
  const res = settle(bet, multiplier, win, outcome);
  commit();
  return { betId: bet.id, reference: bet.reference, stake: amount, multiplier, win, outcome, balance: res.wallet.balance, bonusUnlocked: res.converted };
}

/* ---- tirages programmés de la démo ---- */
function runDueDraws(now = new Date()) {
  let changed = false;
  for (const [id, d] of Object.entries(state.lnDraws)) {
    if (d.status !== 'open' || d.drawAt > now) continue;
    d.numbers = drawNumbers(weakRng);
    d.status = 'drawn';
    for (const bet of state.bets.filter((b) => b.drawId === id && b.status === 'pending')) {
      const matches = countMatches(bet.numbers, d.numbers);
      const { multiplier, win } = luckyNumberWin(bet.stake, matches);
      settle(bet, multiplier, win, { drawn: d.numbers, matches });
    }
    changed = true;
  }
  for (const [id, r] of Object.entries(state.jackpotRounds)) {
    if (r.status === 'open' && r.drawAt <= now) { drawJackpot(id); changed = true; }
  }
  if (changed) commit();
}

function drawJackpot(roundId) {
  const r = state.jackpotRounds[roundId];
  const purchases = state.bets.filter((b) => b.roundId === roundId && b.status === 'pending');
  const winner = pickJackpotWinner(purchases, weakRng);
  for (const p of purchases) {
    const isWinner = winner?.purchase.id === p.id;
    settle(p, isWinner ? r.pool / p.stake : 0, isWinner ? r.pool : 0, { roundId, winningTicket: winner?.ticketNumber ?? null, totalTickets: winner?.totalTickets ?? 0 });
  }
  r.status = 'drawn';
  r.winner = winner ? { uid: winner.purchase.uid, name: winner.purchase.playerName, tickets: winner.purchase.tickets, ticketNumber: winner.ticketNumber, amount: r.pool } : null;
}

if (typeof window !== 'undefined') setInterval(() => runDueDraws(), 1000);

const publicName = (n) => { const [a, b] = String(n).split(' '); return b ? `${a} ${b[0]}.` : a; };

export const gamesService = {
  config: { luckyNumber: LN_DEMO, jackpot: JACKPOT },

  async playSpin({ stake: amount }) {
    await delay(350);
    return playInstant(GAME.LUCKY_SPIN, amount, LUCKY_SPIN, () => {
      const r = spinWheel(weakRng);
      return { multiplier: r.multiplier, outcome: { segmentIndex: r.segmentIndex } };
    });
  },

  async playBox({ stake: amount, box }) {
    await delay(350);
    assertRule(validateBoxChoice(box));
    return playInstant(GAME.MYSTERY_BOX, amount, MYSTERY_BOX, () => {
      const r = openBoxes(box, weakRng);
      return { multiplier: r.multiplier, outcome: { chosen: box, boxes: r.boxes } };
    });
  },

  async buyNumbers({ stake: amount, numbers }) {
    await delay(350);
    const { uid } = me();
    assertRule(validateStake(amount, LUCKY_NUMBER));
    const picked = assertRule(validateNumbers(numbers)).value;
    const { drawId, drawAt } = ticketDrawSlot(new Date(), LN_DEMO);
    const bet = stake(uid, GAME.LUCKY_NUMBER, amount, { numbers: picked, drawId, drawAt });
    const d = state.lnDraws[drawId] ??= { drawAt, status: 'open', numbers: null, ticketCount: 0, totalStake: 0 };
    d.ticketCount += 1; d.totalStake += amount;
    commit();
    return { betId: bet.id, reference: bet.reference, drawId, drawAt: drawAt.toISOString(), numbers: picked };
  },

  async buyJackpot({ tickets }) {
    await delay(350);
    const { uid, user } = me();
    const { stake: amount } = assertRule(validateTicketCount(tickets));
    const { roundId, drawAt } = jackpotRoundFor(new Date());
    const bet = stake(uid, GAME.JACKPOT, amount, { tickets, roundId, drawAt, playerName: publicName(user.fullName) });
    const r = state.jackpotRounds[roundId] ??= { drawAt, status: 'open', pool: JACKPOT.seed, ticketCount: 0, purchaseCount: 0, winner: null };
    r.pool = jackpotPoolAfter(r.pool, amount); r.ticketCount += tickets; r.purchaseCount += 1;
    commit();
    return { betId: bet.id, reference: bet.reference, roundId, tickets, pool: r.pool };
  },

  watchBets(uid, { limit = 50 } = {}, cb) {
    return subscribe(() => cb(state.bets.filter((b) => b.uid === uid).slice(0, limit).map((b) => ({ ...b }))));
  },
  watchMyTickets(uid, drawId, cb) {
    return subscribe(() => cb(state.bets.filter((b) => b.uid === uid && b.drawId === drawId).map((b) => ({ ...b }))));
  },
  watchRecentDraws(cb, _e, limit = 5) {
    return subscribe(() => cb(Object.entries(state.lnDraws).filter(([, d]) => d.status === 'drawn')
      .sort(([, a], [, b]) => b.drawAt - a.drawAt).slice(0, limit).map(([id, d]) => ({ id, ...d }))));
  },
  watchJackpotRound(roundId, cb) {
    return subscribe(() => { const r = state.jackpotRounds[roundId]; cb(r ? { id: roundId, ...r } : null); });
  },
  watchJackpotWinners(cb, _e, limit = 5) {
    return subscribe(() => cb(Object.entries(state.jackpotRounds).filter(([, r]) => r.status === 'drawn')
      .sort(([, a], [, b]) => b.drawAt - a.drawAt).slice(0, limit).map(([id, r]) => ({ id, ...r }))));
  },

  /** Commandes réservées à la démo. */
  demo: {
    drawNumbersNow() {
      const open = Object.entries(state.lnDraws).find(([, d]) => d.status === 'open');
      if (open) { open[1].drawAt = new Date(); runDueDraws(); }
    },
    drawJackpotNow() {
      const open = Object.entries(state.jackpotRounds).find(([, r]) => r.status === 'open');
      if (open) { drawJackpot(open[0]); commit(); }
    },
  },
};
