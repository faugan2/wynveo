import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LUCKY_SPIN, MYSTERY_BOX, LUCKY_NUMBER, JACKPOT, expectedReturn, spinWheel, openBoxes, validateStake,
  validateNumbers, nextDrawSlot, ticketDrawSlot, isDrawOpen, drawNumbers, countMatches, luckyNumberWin,
  luckyNumberOdds, luckyNumberRtp, validateTicketCount, jackpotRoundFor, jackpotPoolAfter, pickJackpotWinner,
  pickWeighted, drawDistinct, applyStake, applySettlement, splitWin, createEmptyWallet, betResult,
} from '../src/index.js';

test('résultat affiché d\'un pari', () => {
  assert.equal(betResult({ status: 'won', stake: 1000, win: 5000 }), 'won');
  assert.equal(betResult({ status: 'won', stake: 1000, win: 1000 }), 'refunded');
  assert.equal(betResult({ status: 'won', stake: 1000, win: 500 }), 'partial');
  assert.equal(betResult({ status: 'lost', stake: 1000, win: 0 }), 'lost');
  assert.equal(betResult({ status: 'pending', stake: 1000, win: 0 }), 'pending');
});

const seq = (values) => { let i = 0; return () => values[i++ % values.length]; };

test('taux de retour : la maison garde toujours une marge', () => {
  const spin = expectedReturn(LUCKY_SPIN.segments);
  const box = expectedReturn(MYSTERY_BOX.prizes);
  const ln = luckyNumberRtp();
  assert.ok(Math.abs(spin - 0.899) < 1e-9, `Lucky Spin RTP ${spin}`);
  assert.ok(Math.abs(box - 0.89) < 1e-9, `Mystery Box RTP ${box}`);
  assert.ok(ln > 0.6 && ln < 0.8, `Lucky Number RTP ${ln}`);
  assert.equal(LUCKY_SPIN.segments.reduce((s, x) => s + x.weight, 0), 10_000);
  const odds = [0, 1, 2, 3, 4, 5].reduce((s, k) => s + luckyNumberOdds(k), 0);
  assert.ok(Math.abs(odds - 1) < 1e-12);
  assert.ok(JACKPOT.poolShare < 1);
});

test('tirages pondérés et numéros distincts', () => {
  assert.equal(pickWeighted([1, 1, 1], () => 2), 2);
  assert.equal(pickWeighted([5, 10], () => 4), 0);
  assert.equal(pickWeighted([5, 10], () => 5), 1);
  const nums = drawDistinct(5, 50, (n) => n - 1);
  assert.equal(new Set(nums).size, 5);
  assert.ok(nums.every((n) => n >= 1 && n <= 50));
  // fréquences d'une roue tirée 200 000 fois avec un générateur réel
  const counts = new Array(LUCKY_SPIN.segments.length).fill(0);
  for (let i = 0; i < 200_000; i += 1) counts[spinWheel((n) => Math.floor(Math.random() * n)).segmentIndex] += 1;
  assert.ok(Math.abs(counts[5] / 200_000 - 0.838) < 0.01);
});

test('Lucky Spin et Mystery Box', () => {
  assert.deepEqual(spinWheel(() => 0), { segmentIndex: 0, multiplier: 2 });
  assert.equal(spinWheel(() => 9_999).multiplier, 2);
  assert.equal(spinWheel(() => 1_400).multiplier, 0.5);
  assert.equal(validateStake(50, LUCKY_SPIN).code, 'STAKE_TOO_LOW');
  assert.equal(validateStake(20_000, LUCKY_SPIN).code, 'STAKE_TOO_HIGH');
  const { boxes, multiplier } = openBoxes(4, seq([99, 0, 50, 95, 98, 0, 0, 0, 0]));
  assert.equal(boxes.length, 9);
  assert.equal(multiplier, boxes[4]);
  assert.equal(boxes[0], 10);
});

test('Lucky Number : créneaux, clôture, gains', () => {
  const now = new Date('2026-10-14T09:21:10Z');
  const slot = nextDrawSlot(now);
  assert.equal(slot.drawAt.toISOString(), '2026-10-14T09:30:00.000Z');
  assert.equal(slot.drawId, 'LN-202610140930');
  assert.equal(isDrawOpen(slot.drawAt, new Date('2026-10-14T09:29:45Z')), false);
  assert.equal(ticketDrawSlot(new Date('2026-10-14T09:29:45Z')).drawId, 'LN-202610140945');
  assert.equal(validateNumbers([1, 2, 3, 4]).code, 'NUMBERS_COUNT');
  assert.equal(validateNumbers([1, 2, 3, 4, 4]).code, 'NUMBERS_INVALID');
  assert.equal(validateNumbers([51, 2, 3, 4, 5]).code, 'NUMBERS_INVALID');
  assert.deepEqual(validateNumbers([46, 7, 23, 31, 14]).value, [7, 14, 23, 31, 46]);
  assert.equal(countMatches([7, 14, 23, 31, 46], [7, 12, 23, 39, 46]), 3);
  assert.deepEqual(luckyNumberWin(1000, 3), { multiplier: 60, win: 60_000 });
  assert.deepEqual(luckyNumberWin(1000, 1), { multiplier: 0, win: 0 });
  assert.equal(luckyNumberWin(1000, 4).win < luckyNumberWin(1000, 5).win, true, '5 bons numéros rapportent plus que 4');
  assert.equal(luckyNumberWin(LUCKY_NUMBER.maxStake, 5).win, LUCKY_NUMBER.maxWin);
  assert.equal(luckyNumberWin(5000, 5).win, LUCKY_NUMBER.maxWin);
  assert.equal(drawNumbers((n) => 0).length, 5);
});

test('Jackpot : tickets, tirage du jour, gagnant', () => {
  assert.equal(validateTicketCount(3).stake, 3000);
  assert.equal(validateTicketCount(0).code, 'TICKETS_INVALID');
  assert.equal(jackpotRoundFor(new Date('2026-10-14T09:00:00Z')).roundId, 'JP-20261014');
  assert.equal(jackpotRoundFor(new Date('2026-10-14T20:30:00Z')).roundId, 'JP-20261015');
  assert.equal(jackpotPoolAfter(0, 1000), 800);
  const purchases = [{ id: 'a', uid: 'u1', tickets: 2 }, { id: 'b', uid: 'u2', tickets: 3 }];
  assert.equal(pickJackpotWinner(purchases, () => 1).purchase.id, 'a');
  assert.equal(pickJackpotWinner(purchases, () => 2).purchase.id, 'b');
  assert.equal(pickJackpotWinner([], () => 0), null);
});

test('mise : argent réel d\'abord, gain au prorata, bonus converti une fois misé', () => {
  const w = { ...createEmptyWallet(), balance: 1000, bonusBalance: 5000, bonusWagerRemaining: 6000 };
  assert.equal(applyStake(w, 7000).code, 'INSUFFICIENT_FUNDS');
  const bet = applyStake(w, 4000);
  assert.deepEqual(bet.split, { fromReal: 1000, fromBonus: 3000 });
  assert.equal(bet.wallet.balance, 0);
  assert.equal(bet.wallet.bonusBalance, 2000);
  assert.equal(bet.wallet.bonusWagerRemaining, 2000);
  assert.deepEqual(splitWin(8000, 4000, bet.split), { toReal: 2000, toBonus: 6000 });
  const won = applySettlement(bet.wallet, { stake: 4000, split: bet.split, win: 8000 });
  assert.equal(won.wallet.balance, 2000);
  assert.equal(won.wallet.bonusBalance, 8000);
  assert.equal(won.converted, 0);
  // dernière mise qui termine les conditions : le bonus devient retirable
  const bet2 = applyStake(won.wallet, 2000);
  assert.equal(bet2.wallet.bonusWagerRemaining, 0);
  const done = applySettlement(bet2.wallet, { stake: 2000, split: bet2.split, win: 0 });
  assert.equal(done.converted, 8000);
  assert.equal(done.wallet.balance, 8000);
  assert.equal(done.wallet.bonusBalance, 0);
  // bonus perdu en entier : plus rien à miser
  const lost = applySettlement({ ...createEmptyWallet(), balance: 0, bonusBalance: 0, bonusWagerRemaining: 9000 }, { stake: 1000, split: { fromReal: 0, fromBonus: 1000 }, win: 0 });
  assert.equal(lost.wallet.bonusWagerRemaining, 0);
});
