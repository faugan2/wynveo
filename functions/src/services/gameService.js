/**
 * Jeux : toutes les mises, tous les tirages et tous les gains se font ici,
 * dans des transactions Firestore. Le navigateur ne reçoit que le résultat.
 *
 * - Lucky Spin et Mystery Box : mise + tirage + gain dans une seule transaction.
 * - Lucky Number : le ticket est payé tout de suite, le tirage a lieu toutes les 15 min.
 * - Jackpot : tickets achetés dans la journée, un gagnant tiré chaque soir.
 */
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db, COL, FieldValue } from '../lib/firebase.js';
import { assertRule } from '../lib/guards.js';
import { secureRng } from '../lib/rng.js';
import {
  walletRef, newTxRef, newBetRef, betRef, lnDrawRef, jackpotRoundRef, walletFromDoc, walletUpdate, newTransaction,
} from '../repositories/index.js';
import { getActivePlayer } from './profileService.js';
import {
  GAME, GAME_LABEL, LUCKY_SPIN, MYSTERY_BOX, LUCKY_NUMBER, JACKPOT, TX_TYPE, TX_STATUS,
  validateStake, spinWheel, validateBoxChoice, openBoxes, validateNumbers, ticketDrawSlot, drawNumbers,
  countMatches, luckyNumberWin, validateTicketCount, jackpotRoundFor, jackpotPoolAfter, pickJackpotWinner,
  applyStake, applySettlement, winAmount, makeReference, dayKey,
} from '../core/index.js';

const BET_PREFIX = { lucky_spin: 'SP', mystery_box: 'MB', lucky_number: 'LN', jackpot: 'JP' };
export const BET_STATUS = Object.freeze({ PENDING: 'pending', WON: 'won', LOST: 'lost' });

/** Débite la mise et enregistre le pari + l'opération "Mise". À appeler dans une transaction, après toutes les lectures. */
function writeStake(t, { uid, wallet, wSnapRef, game, stake, fields }) {
  const staked = assertRule(applyStake(wallet, stake));
  const ref = newBetRef();
  const reference = makeReference(BET_PREFIX[game]);
  const bet = {
    uid, product: 'games', game, stake, split: staked.split, reference,
    status: BET_STATUS.PENDING, multiplier: null, win: 0, ...fields,
    createdAt: FieldValue.serverTimestamp(), settledAt: null,
  };
  t.set(ref, bet);
  t.set(newTxRef(), newTransaction({
    uid, type: TX_TYPE.BET, status: TX_STATUS.SUCCESS, amount: stake, product: 'games', game, betId: ref.id,
    reference, label: `Mise ${GAME_LABEL[game]}`, dayKey: dayKey(), balanceAfter: staked.wallet.balance,
  }));
  return { betId: ref.id, reference, bet, wallet: staked.wallet };
}

/** Crédite un gain (ou constate la perte) et convertit le bonus si les conditions sont remplies. */
function writeSettlement(t, { uid, wallet, wSnapRef, betId, bet, multiplier, win, outcome }) {
  const settled = applySettlement(wallet, { stake: bet.stake, split: bet.split, win });
  t.set(wSnapRef, walletUpdate(settled.wallet), { merge: true });
  t.set(betRef(betId), {
    ...bet, status: win > 0 ? BET_STATUS.WON : BET_STATUS.LOST, multiplier, win, outcome,
    settledAt: FieldValue.serverTimestamp(),
  });
  if (win > 0) {
    t.set(newTxRef(), newTransaction({
      uid, type: TX_TYPE.WIN, status: TX_STATUS.SUCCESS, amount: win, product: 'games', game: bet.game, betId,
      reference: bet.reference, label: `Gain ${GAME_LABEL[bet.game]}`, dayKey: dayKey(), balanceAfter: settled.wallet.balance,
    }));
  }
  if (settled.converted > 0) {
    t.set(newTxRef(), newTransaction({
      uid, type: TX_TYPE.BONUS_UNLOCK, status: TX_STATUS.SUCCESS, amount: settled.converted, dayKey: dayKey(),
      reference: bet.reference, label: 'Bonus débloqué : devenu retirable', balanceAfter: settled.wallet.balance,
    }));
  }
  return settled;
}

/* ---------------- Jeux instantanés ---------------- */

async function playInstant(uid, game, stake, config, draw) {
  assertRule(validateStake(stake, config));
  return db.runTransaction(async (t) => {
    await getActivePlayer(uid, t);
    const wSnap = await t.get(walletRef(uid));
    const staked = writeStake(t, { uid, wallet: walletFromDoc(wSnap), wSnapRef: wSnap.ref, game, stake, fields: {} });
    const { multiplier, outcome } = draw();
    const win = winAmount(stake, multiplier);
    const settled = writeSettlement(t, {
      uid, wallet: staked.wallet, wSnapRef: wSnap.ref, betId: staked.betId, bet: staked.bet, multiplier, win, outcome,
    });
    return {
      betId: staked.betId, reference: staked.reference, stake, multiplier, win, outcome,
      balance: settled.wallet.balance, bonusBalance: settled.wallet.bonusBalance, bonusUnlocked: settled.converted,
    };
  });
}

export async function playLuckySpin(uid, { stake } = {}) {
  return playInstant(uid, GAME.LUCKY_SPIN, stake, LUCKY_SPIN, () => {
    const r = spinWheel(secureRng);
    return { multiplier: r.multiplier, outcome: { segmentIndex: r.segmentIndex } };
  });
}

export async function playMysteryBox(uid, { stake, box } = {}) {
  assertRule(validateBoxChoice(box));
  return playInstant(uid, GAME.MYSTERY_BOX, stake, MYSTERY_BOX, () => {
    const r = openBoxes(box, secureRng);
    return { multiplier: r.multiplier, outcome: { chosen: box, boxes: r.boxes } };
  });
}

/* ---------------- Lucky Number ---------------- */

export async function buyLuckyNumber(uid, { stake, numbers } = {}, now = new Date()) {
  assertRule(validateStake(stake, LUCKY_NUMBER));
  const picked = assertRule(validateNumbers(numbers)).value;
  const { drawId, drawAt } = ticketDrawSlot(now);
  return db.runTransaction(async (t) => {
    await getActivePlayer(uid, t);
    const [wSnap, dSnap] = await Promise.all([t.get(walletRef(uid)), t.get(lnDrawRef(drawId))]);
    if (dSnap.exists && dSnap.data().status !== 'open') throw new HttpsError('failed-precondition', 'Ce tirage est clos. Réessayez.');
    const staked = writeStake(t, {
      uid, wallet: walletFromDoc(wSnap), wSnapRef: wSnap.ref, game: GAME.LUCKY_NUMBER, stake, fields: { numbers: picked, drawId, drawAt },
    });
    t.set(wSnap.ref, walletUpdate(staked.wallet), { merge: true });
    const d = dSnap.exists ? dSnap.data() : { drawAt, status: 'open', numbers: null, ticketCount: 0, totalStake: 0, totalWon: 0 };
    t.set(lnDrawRef(drawId), { ...d, ticketCount: d.ticketCount + 1, totalStake: d.totalStake + stake });
    return { betId: staked.betId, reference: staked.reference, drawId, drawAt: drawAt.toISOString(), numbers: picked, balance: staked.wallet.balance };
  });
}

/** Tire les numéros des tirages arrivés à échéance puis règle leurs tickets. Rejouable sans risque. */
export async function runLuckyNumberDraws(now = new Date()) {
  const open = await db.collection(COL.LN_DRAWS).where('status', '==', 'open').get();
  const due = open.docs.filter((d) => toDate(d.data().drawAt) <= now);
  const drawing = await db.collection(COL.LN_DRAWS).where('status', '==', 'settling').get();
  const results = [];
  for (const doc of [...due, ...drawing.docs]) {
    const numbers = await db.runTransaction(async (t) => {
      const snap = await t.get(doc.ref);
      const d = snap.data();
      if (d.status === 'drawn') return null;
      if (d.status === 'settling') return d.numbers;
      const drawn = drawNumbers(secureRng);
      t.update(doc.ref, { status: 'settling', numbers: drawn, drawnAt: FieldValue.serverTimestamp() });
      return drawn;
    });
    if (!numbers) continue;
    const settled = await settleLuckyNumberTickets(doc.id, numbers);
    await doc.ref.update({ status: 'drawn', ...settled });
    results.push({ drawId: doc.id, numbers, ...settled });
  }
  return results;
}

async function settleLuckyNumberTickets(drawId, numbers) {
  const tickets = await db.collection(COL.BETS).where('drawId', '==', drawId).where('status', '==', BET_STATUS.PENDING).get();
  let totalWon = 0;
  let winners = 0;
  for (const ticket of tickets.docs) {
    const res = await db.runTransaction(async (t) => {
      const bSnap = await t.get(ticket.ref);
      const bet = bSnap.data();
      if (bet.status !== BET_STATUS.PENDING) return 0;
      const wSnap = await t.get(walletRef(bet.uid));
      const matches = countMatches(bet.numbers, numbers);
      const { multiplier, win } = luckyNumberWin(bet.stake, matches);
      writeSettlement(t, {
        uid: bet.uid, wallet: walletFromDoc(wSnap), wSnapRef: wSnap.ref, betId: ticket.id, bet, multiplier, win,
        outcome: { drawn: numbers, matches },
      });
      return win;
    });
    totalWon += res;
    if (res > 0) winners += 1;
  }
  return { totalWon, winners };
}

/* ---------------- Jackpot ---------------- */

export async function buyJackpotTickets(uid, { tickets } = {}, now = new Date()) {
  const { stake } = assertRule(validateTicketCount(tickets));
  const { roundId, drawAt } = jackpotRoundFor(now);
  return db.runTransaction(async (t) => {
    const user = await getActivePlayer(uid, t);
    const [wSnap, rSnap] = await Promise.all([t.get(walletRef(uid)), t.get(jackpotRoundRef(roundId))]);
    if (rSnap.exists && rSnap.data().status !== 'open') throw new HttpsError('failed-precondition', 'Le tirage du jour est clos.');
    const staked = writeStake(t, {
      uid, wallet: walletFromDoc(wSnap), wSnapRef: wSnap.ref, game: GAME.JACKPOT, stake, fields: { tickets, roundId, drawAt, playerName: publicName(user.fullName) },
    });
    t.set(wSnap.ref, walletUpdate(staked.wallet), { merge: true });
    const r = rSnap.exists ? rSnap.data() : newRound(drawAt, JACKPOT.seed);
    const next = { ...r, pool: jackpotPoolAfter(r.pool, stake), ticketCount: r.ticketCount + tickets, purchaseCount: r.purchaseCount + 1 };
    t.set(jackpotRoundRef(roundId), next);
    return { betId: staked.betId, reference: staked.reference, roundId, drawAt: drawAt.toISOString(), tickets, pool: next.pool, balance: staked.wallet.balance };
  });
}

/** Tirage du soir : désigne un ticket gagnant, lui verse la cagnotte, règle les autres tickets. */
export async function runJackpotDraw(now = new Date()) {
  const open = await db.collection(COL.JACKPOT_ROUNDS).where('status', '==', 'open').get();
  const results = [];
  for (const round of open.docs.filter((d) => toDate(d.data().drawAt) <= now)) {
    const purchasesSnap = await db.collection(COL.BETS).where('roundId', '==', round.id).where('status', '==', BET_STATUS.PENDING).get();
    const purchases = purchasesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const winner = pickJackpotWinner(purchases, secureRng);
    await db.runTransaction(async (t) => {
      const rSnap = await t.get(round.ref);
      const r = rSnap.data();
      if (r.status !== 'open') return;
      const pool = r.pool;
      // Toutes les lectures d'abord (règle des transactions Firestore), puis les écritures.
      const next = jackpotRoundFor(new Date(toDate(r.drawAt).getTime() + 1000));
      const nextSnap = await t.get(jackpotRoundRef(next.roundId));
      const reads = await Promise.all(purchases.map((p) => Promise.all([t.get(betRef(p.id)), t.get(walletRef(p.uid))])));
      const wallets = new Map();
      reads.forEach(([, wSnap], i) => { if (!wallets.has(purchases[i].uid)) wallets.set(purchases[i].uid, { ref: wSnap.ref, wallet: walletFromDoc(wSnap) }); });
      reads.forEach(([bSnap], i) => {
        const p = purchases[i];
        const bet = bSnap.data();
        if (bet.status !== BET_STATUS.PENDING) return;
        const isWinner = winner && winner.purchase.id === p.id;
        const w = wallets.get(p.uid);
        const settled = writeSettlement(t, {
          uid: p.uid, wallet: w.wallet, wSnapRef: w.ref, betId: p.id, bet,
          multiplier: isWinner ? pool / bet.stake : 0, win: isWinner ? pool : 0,
          outcome: { roundId: round.id, winningTicket: winner?.ticketNumber ?? null, totalTickets: winner?.totalTickets ?? 0 },
        });
        w.wallet = settled.wallet;
      });
      t.update(round.ref, {
        status: 'drawn', drawnAt: FieldValue.serverTimestamp(),
        winner: winner ? { uid: winner.purchase.uid, name: winner.purchase.playerName, tickets: winner.purchase.tickets, ticketNumber: winner.ticketNumber, amount: pool } : null,
      });
      // Personne n'a joué : la cagnotte est reportée sur le tirage suivant.
      if (!winner && pool > 0) {
        if (nextSnap.exists) t.update(nextSnap.ref, { pool: nextSnap.data().pool + pool });
        else t.set(jackpotRoundRef(next.roundId), newRound(next.drawAt, pool));
      }
    });
    logger.info('Jackpot tiré', { roundId: round.id, winner: winner?.purchase.uid ?? null });
    results.push({ roundId: round.id, winnerUid: winner?.purchase.uid ?? null, pool: round.data().pool });
  }
  return results;
}

function newRound(drawAt, pool) {
  return { drawAt, status: 'open', pool, ticketCount: 0, purchaseCount: 0, winner: null };
}

/** "Kossi Amouzou" -> "Kossi A." (affiché publiquement pour les gagnants). */
function publicName(fullName) {
  const [first, last] = String(fullName ?? '').split(' ');
  return last ? `${first} ${last[0]}.` : first || 'Joueur';
}

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : new Date(v));
