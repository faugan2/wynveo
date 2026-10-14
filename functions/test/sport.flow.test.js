/** Paris sportifs exécutés sur les vrais services avec un Firestore en mémoire. */
import { test, mock, before } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from './fakeFirestore.js';

const fake = createFakeFirestore();
const COL = {
  USERS: 'users', WALLETS: 'wallets', TRANSACTIONS: 'transactions', ADMIN_LOGS: 'adminLogs', REFERRAL_CODES: 'referralCodes',
  BETS: 'bets', LN_DRAWS: 'lnDraws', JACKPOT_ROUNDS: 'jackpotRounds', SPORT_EVENTS: 'sportEvents',
};
mock.module('../src/lib/firebase.js', { namedExports: { db: fake.db, FieldValue: fake.FieldValue, Timestamp: Date, adminAuth: {}, COL } });

let sport; let imp;
before(async () => {
  sport = await import('../src/services/sportService.js');
  imp = await import('../src/services/sportImportService.js');
});

const NOW = new Date('2026-10-14T12:00:00Z');
const admin = { uid: 'adm', email: 'trader@wynveo.com' };
const W = (uid) => fake.db._get(`wallets/${uid}`);
const E = (id) => fake.db._get(`sportEvents/${id}`);
const bets = (uid) => Object.entries(fake.db._dump()).filter(([p, v]) => p.startsWith('bets/') && v.uid === uid).map(([p, v]) => ({ id: p.slice(5), ...v }));
function player(uid, wallet) {
  fake.db._set(`users/${uid}`, { fullName: `Joueur ${uid}`, phone: '+22890000000', status: 'active', kycStatus: 'none', phoneVerified: true });
  fake.db._set(`wallets/${uid}`, { balance: 0, bonusBalance: 0, bonusWagerRemaining: 0, depositCount: 1, welcomeBonusGranted: true, ...wallet });
}
function event(id, over = {}) {
  fake.db._set(`sportEvents/${id}`, {
    sport: 'football', league: 'Premier League', home: `Home ${id}`, away: `Away ${id}`, startAt: new Date('2026-10-14T18:00:00Z'),
    status: 'scheduled', suspended: false, score: null, betCount: 0, totalStake: 0,
    markets: { h2h: { home: 2.0, draw: 3.4, away: 3.5 }, totals: { line: 2.5, over: 1.9, under: 1.9 } }, ...over,
  });
}
const pick = (eventId, outcome, odds, market = 'h2h') => ({ eventId, market, outcome, odds });

test('pari simple : mise débitée, ticket enregistré avec la photo du match', async () => {
  player('a', { balance: 10_000 });
  event('m1');
  const r = await sport.placeSportBet('a', { type: 'single', stake: 2000, selections: [pick('m1', 'home', 2.0)] }, NOW);
  assert.equal(r.tickets.length, 1);
  assert.equal(r.tickets[0].potentialWin, 4000);
  assert.equal(W('a').balance, 8000);
  const b = bets('a')[0];
  assert.equal(b.selections[0].pick, 'Home m1');
  assert.equal(b.selections[0].event, 'Home m1 – Away m1');
  assert.deepEqual(b.eventIds, ['m1']);
  assert.equal(E('m1').totalStake, 2000);
});

test('cote modifiée : refusée sans accord, acceptée avec ; match commencé ou suspendu : refusé', async () => {
  player('b', { balance: 10_000 });
  event('m2', { markets: { h2h: { home: 1.8, draw: 3.4, away: 3.5 } } });
  await assert.rejects(sport.placeSportBet('b', { type: 'single', stake: 1000, selections: [pick('m2', 'home', 2.0)] }, NOW), /cotes ont changé/);
  const r = await sport.placeSportBet('b', { type: 'single', stake: 1000, selections: [pick('m2', 'home', 2.0)], acceptOddsChanges: true }, NOW);
  assert.equal(r.tickets[0].totalOdds, 1.8);
  assert.equal(r.oddsChanged, true);
  await assert.rejects(sport.placeSportBet('b', { type: 'single', stake: 1000, selections: [pick('m2', 'home', 1.8)] }, new Date('2026-10-14T18:00:01Z')), /plus disponible/);
  event('m3', { suspended: true });
  await assert.rejects(sport.placeSportBet('b', { type: 'single', stake: 1000, selections: [pick('m3', 'home', 2.0)] }, NOW), /plus disponible/);
  await assert.rejects(sport.placeSportBet('b', { type: 'single', stake: 99_999, selections: [pick('m2', 'home', 1.8)] }, NOW), /Solde insuffisant/);
});

test('combiné : un ticket, cotes multipliées ; réglé quand tous les matchs sont finis', async () => {
  player('c', { balance: 10_000 });
  event('c1'); event('c2'); event('c3');
  const r = await sport.placeSportBet('c', {
    type: 'combo', stake: 1000,
    selections: [pick('c1', 'home', 2.0), pick('c2', 'over', 1.9, 'totals'), pick('c3', 'draw', 3.4)],
  }, NOW);
  assert.equal(r.tickets.length, 1);
  assert.equal(r.tickets[0].totalOdds, 12.92);
  assert.equal(W('c').balance, 9000);
  await sport.setSportEventResult(admin, { eventId: 'c1', score: { home: 2, away: 0 } });
  await sport.setSportEventResult(admin, { eventId: 'c2', score: { home: 2, away: 2 } });
  assert.equal(bets('c')[0].status, 'pending', 'encore un match à jouer');
  // c3 annulé : son choix compte 1, le ticket est gagné avec 2.0 × 1.9
  await sport.setSportEventResult(admin, { eventId: 'c3', cancelled: true });
  const b = bets('c')[0];
  assert.equal(b.status, 'won');
  assert.equal(b.win, 3800);
  assert.equal(W('c').balance, 12_800);
  await assert.rejects(sport.setSportEventResult(admin, { eventId: 'c1', score: { home: 0, away: 0 } }), /déjà enregistré/);
});

test('combiné perdu dès qu\'un choix est perdu ; pari simple remboursé si match annulé', async () => {
  player('d', { balance: 5000 });
  event('d1'); event('d2'); event('d3');
  await sport.placeSportBet('d', { type: 'combo', stake: 1000, selections: [pick('d1', 'home', 2.0), pick('d2', 'home', 2.0)] }, NOW);
  await sport.placeSportBet('d', { type: 'single', stake: 1000, selections: [pick('d3', 'away', 3.5)] }, NOW);
  await sport.setSportEventResult(admin, { eventId: 'd1', score: { home: 0, away: 1 } });
  const combo = bets('d').find((b) => b.type === 'combo');
  assert.equal(combo.status, 'lost');
  await sport.setSportEventResult(admin, { eventId: 'd3', cancelled: true });
  const single = bets('d').find((b) => b.type === 'single');
  assert.equal(single.status, 'void');
  assert.equal(W('d').balance, 4000, 'combiné perdu (−1000), simple remboursé');
  const refund = Object.values(fake.db._dump()).find((t) => t.uid === 'd' && t.type === 'refund');
  assert.equal(refund.amount, 1000);
});

test('admin : création et modification d\'un match, contrôles', async () => {
  const created = await sport.upsertSportEvent(admin, {
    sport: 'football', league: 'Togo D1', home: 'ASKO Kara', away: 'Dynamic Togolais', startAt: '2026-10-15T15:00:00Z',
    markets: { h2h: { home: 2.3, draw: 2.9, away: 3.4 }, totals: { line: 2.5, over: 2.1, under: 1.7 } },
  });
  const e = E(created.id);
  assert.equal(e.status, 'scheduled');
  assert.equal(e.markets.h2h.draw, 2.9);
  await assert.rejects(sport.upsertSportEvent(admin, { sport: 'football', league: 'x', home: 'A', away: 'A', startAt: '2026-10-15T15:00:00Z', markets: { h2h: { home: 2, draw: 3, away: 3 } } }), /différentes/);
  await assert.rejects(sport.upsertSportEvent(admin, { sport: 'football', league: 'x', home: 'A', away: 'B', startAt: '2026-10-15T15:00:00Z', markets: { h2h: { home: 2, away: 3 } } }), /supérieures à 1,01/);
  await sport.upsertSportEvent(admin, { id: created.id, sport: 'football', league: 'Togo D1', home: 'ASKO Kara', away: 'Dynamic Togolais', startAt: '2026-10-15T15:00:00Z', markets: { h2h: { home: 2.2, draw: 2.9, away: 3.5 } } });
  assert.equal(E(created.id).markets.h2h.home, 2.2);
  await sport.setSportEventSuspended(admin, { eventId: created.id, suspended: true });
  assert.equal(E(created.id).suspended, true);
  const logs = Object.entries(fake.db._dump()).filter(([p]) => p.startsWith('adminLogs/')).length;
  assert.ok(logs >= 3);
});

test('The Odds API : import des cotes (création puis mise à jour) et des scores avec règlement', async () => {
  const oddsPayload = (homePrice) => [{
    id: 'x9', sport_key: 'soccer_epl', commence_time: '2026-10-14T19:00:00Z', home_team: 'Arsenal', away_team: 'Chelsea',
    bookmakers: [{ key: 'b1', markets: [{ key: 'h2h', outcomes: [{ name: 'Arsenal', price: homePrice }, { name: 'Chelsea', price: 3.6 }, { name: 'Draw', price: 3.5 }] }] }],
  }];
  const calls = [];
  let price = 2.1;
  const fetchJson = async (url) => { calls.push(url); return { data: url.includes('/scores') ? scores : oddsPayload(price), remaining: '480' }; };
  let scores = [];
  const comp = [{ key: 'soccer_epl', sport: 'football', league: 'Premier League' }];
  const r1 = await imp.importOdds({ apiKey: 'K', fetchJson, competitions: comp });
  assert.deepEqual([r1.created, r1.updated, r1.remaining], [1, 0, '480']);
  assert.ok(calls[0].includes('/soccer_epl/odds?') && calls[0].includes('apiKey=K'));
  const first = E('oa_x9').markets.h2h.home;
  price = 1.6;
  const r2 = await imp.importOdds({ apiKey: 'K', fetchJson, competitions: comp });
  assert.equal(r2.updated, 1);
  assert.ok(E('oa_x9').markets.h2h.home < first);

  player('e', { balance: 5000 });
  const odds = E('oa_x9').markets.h2h.home;
  await sport.placeSportBet('e', { type: 'single', stake: 1000, selections: [pick('oa_x9', 'home', odds)] }, NOW);
  // pas de match commencé : aucun appel aux scores
  const before = calls.length;
  await imp.importScores({ apiKey: 'K', fetchJson, now: NOW });
  assert.equal(calls.length, before);
  // en direct puis terminé
  scores = [{ id: 'x9', completed: false, home_team: 'Arsenal', away_team: 'Chelsea', scores: [{ name: 'Arsenal', score: '1' }, { name: 'Chelsea', score: '0' }] }];
  await imp.importScores({ apiKey: 'K', fetchJson, now: new Date('2026-10-14T19:30:00Z') });
  assert.equal(E('oa_x9').status, 'live');
  scores = [{ id: 'x9', completed: true, home_team: 'Arsenal', away_team: 'Chelsea', scores: [{ name: 'Arsenal', score: '2' }, { name: 'Chelsea', score: '1' }] }];
  const r3 = await imp.importScores({ apiKey: 'K', fetchJson, now: new Date('2026-10-14T21:00:00Z') });
  assert.equal(r3.finished, 1);
  assert.equal(E('oa_x9').status, 'finished');
  const b = bets('e')[0];
  assert.equal(b.status, 'won');
  assert.equal(W('e').balance, 4000 + Math.floor(1000 * odds));
});
