/**
 * Jeux exécutés sur les vrais services avec un Firestore en mémoire.
 */
import { test, mock, before } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from './fakeFirestore.js';

const fake = createFakeFirestore();
const COL = {
  USERS: 'users', WALLETS: 'wallets', TRANSACTIONS: 'transactions', ADMIN_LOGS: 'adminLogs', REFERRAL_CODES: 'referralCodes',
  BETS: 'bets', LN_DRAWS: 'lnDraws', JACKPOT_ROUNDS: 'jackpotRounds',
};
mock.module('../src/lib/firebase.js', { namedExports: { db: fake.db, FieldValue: fake.FieldValue, Timestamp: Date, adminAuth: {}, COL } });

// Générateur contrôlé pour rendre les tirages prévisibles dans les tests.
let queue = [];
mock.module('../src/lib/rng.js', { namedExports: { secureRng: (n) => { const v = queue.length ? queue.shift() : 0; return Math.min(v, n - 1); } } });

let games;
before(async () => { games = await import('../src/services/gameService.js'); });

const W = (uid) => fake.db._get(`wallets/${uid}`);
const all = (prefix) => Object.entries(fake.db._dump()).filter(([p]) => p.startsWith(prefix)).map(([, v]) => v);
function player(uid, wallet) {
  fake.db._set(`users/${uid}`, { fullName: `Joueur ${uid}`, phone: '+22890000000', status: 'active', kycStatus: 'none', phoneVerified: true });
  fake.db._set(`wallets/${uid}`, { balance: 0, bonusBalance: 0, bonusWagerRemaining: 0, depositCount: 1, welcomeBonusGranted: true, ...wallet });
}

test('Lucky Spin : 5x crédité, mise et gain dans l\'historique', async () => {
  player('a', { balance: 10_000 });
  queue = [250]; // 0-249 = 2x, 250-449 = 5x
  const r = await games.playLuckySpin('a', { stake: 1000 });
  assert.equal(r.multiplier, 5);
  assert.equal(r.win, 5000);
  assert.equal(r.outcome.segmentIndex, 1);
  assert.equal(W('a').balance, 14_000);
  const txs = all('transactions/').filter((t) => t.uid === 'a');
  assert.deepEqual(txs.map((t) => t.type).sort(), ['bet', 'win']);
  assert.equal(all('bets/').find((b) => b.uid === 'a').status, 'won');
});

test('Lucky Spin : 0.5x, mise refusée si solde insuffisant ou hors limites', async () => {
  queue = [5000]; // tombe dans le segment 0.5x
  const r = await games.playLuckySpin('a', { stake: 2000 });
  assert.equal(r.win, 1000);
  assert.equal(W('a').balance, 13_000);
  await assert.rejects(games.playLuckySpin('a', { stake: 50 }), /minimum/);
  await assert.rejects(games.playLuckySpin('a', { stake: 20_000 }), /maximum/);
  player('pauvre', { balance: 500 });
  await assert.rejects(games.playLuckySpin('pauvre', { stake: 1000 }), /Solde insuffisant/);
  assert.equal(W('pauvre').balance, 500);
});

test('Mystery Box : le gain est le contenu du coffre choisi', async () => {
  player('b', { balance: 5000 });
  queue = [99, 0, 0, 0, 70, 0, 0, 0, 0]; // coffre 0 = 10x, coffre 4 = 1x (poids 61 à 80)
  const r = await games.playMysteryBox('b', { stake: 1000, box: 4 });
  assert.equal(r.outcome.boxes[0], 10);
  assert.equal(r.multiplier, 1);
  assert.equal(r.win, 1000);
  assert.equal(W('b').balance, 5000);
  await assert.rejects(games.playMysteryBox('b', { stake: 1000, box: 9 }), /boîte/);
});

test('bonus : mises payées par le bonus, gains au prorata, conversion une fois misé', async () => {
  player('c', { balance: 0, bonusBalance: 5000, bonusWagerRemaining: 3000 });
  queue = [250]; // 5x
  await games.playLuckySpin('c', { stake: 2000 });
  // mise 100 % bonus -> gain 10 000 en bonus ; reste à miser 1 000
  assert.equal(W('c').balance, 0);
  assert.equal(W('c').bonusBalance, 13_000);
  assert.equal(W('c').bonusWagerRemaining, 1000);
  queue = [5000]; // 0.5x
  const r = await games.playLuckySpin('c', { stake: 1000 });
  assert.equal(r.bonusUnlocked, 12_500);
  assert.equal(W('c').balance, 12_500);
  assert.equal(W('c').bonusBalance, 0);
  assert.ok(all('transactions/').some((t) => t.uid === 'c' && t.type === 'bonus_unlock'));
});

test('Lucky Number : ticket payé, tirage, 3 bons numéros = 60x, tirage rejouable sans double paiement', async () => {
  player('d', { balance: 10_000 });
  const now = new Date('2026-10-14T09:21:00Z');
  const t1 = await games.buyLuckyNumber('d', { stake: 1000, numbers: [46, 7, 23, 31, 14] }, now);
  assert.equal(t1.drawId, 'LN-202610140930');
  assert.equal(W('d').balance, 9000);
  await assert.rejects(games.buyLuckyNumber('d', { stake: 1000, numbers: [1, 2, 3] }, now), /exactement 5/);
  // trop tôt : rien n'est tiré
  assert.equal((await games.runLuckyNumberDraws(new Date('2026-10-14T09:29:00Z'))).length, 0);
  // tirage : 7, 23, 46 + deux autres
  queue = [6, 21, 43, 0, 0]; // tire 7, 23, 46, 4, 5
  const res = await games.runLuckyNumberDraws(new Date('2026-10-14T09:30:05Z'));
  assert.equal(res.length, 1);
  const bet = all('bets/').find((b) => b.uid === 'd');
  assert.equal(bet.outcome.matches, 3);
  assert.equal(bet.win, 60_000);
  assert.equal(bet.status, 'won');
  const expected = 9000 + bet.win;
  assert.equal(W('d').balance, expected);
  assert.equal(fake.db._get('lnDraws/LN-202610140930').status, 'drawn');
  assert.equal((await games.runLuckyNumberDraws(new Date('2026-10-14T09:31:00Z'))).length, 0);
  assert.equal(W('d').balance, expected, 'pas de second paiement');
});

test('Jackpot : cagnotte = 80 % des tickets, un seul gagnant, les autres perdent', async () => {
  player('e', { balance: 10_000 });
  player('f', { balance: 10_000 });
  const now = new Date('2026-10-14T10:00:00Z');
  await games.buyJackpotTickets('e', { tickets: 2 }, now);
  const last = await games.buyJackpotTickets('f', { tickets: 3 }, now);
  assert.equal(last.pool, 4000);
  assert.equal(W('e').balance, 8000);
  await assert.rejects(games.buyJackpotTickets('e', { tickets: 0 }, now), /au moins un ticket/);
  queue = [3]; // 4e ticket -> appartient à "f" (tickets 3 à 5)
  const res = await games.runJackpotDraw(new Date('2026-10-14T20:00:30Z'));
  assert.equal(res[0].winnerUid, 'f');
  assert.equal(W('f').balance, 7000 + 4000);
  assert.equal(W('e').balance, 8000);
  const round = fake.db._get('jackpotRounds/JP-20261014');
  assert.equal(round.status, 'drawn');
  assert.equal(round.winner.name, 'Joueur f.');
  assert.equal(round.winner.amount, 4000);
  assert.equal(all('bets/').filter((b) => b.game === 'jackpot' && b.status === 'pending').length, 0);
  assert.equal((await games.runJackpotDraw(new Date('2026-10-14T20:05:00Z'))).length, 0);
});
