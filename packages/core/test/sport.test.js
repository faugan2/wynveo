import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMargin, marginOf, roundOdds, combinedOdds, potentialWin, isEventOpen, currentOdds, outcomeLabel, marketOutcomes,
  buildTickets, oddsChanges, settleSelection, settleTicket, validateScore, parseOddsEvent, parseScoreEvent, SPORT_LIMITS,
} from '../src/index.js';

const now = new Date('2026-10-14T12:00:00Z');
const ev = (over = {}) => ({
  id: 'e1', sport: 'football', league: 'Premier League', home: 'Arsenal', away: 'Chelsea',
  startAt: new Date('2026-10-14T17:30:00Z'), status: 'scheduled', suspended: false,
  markets: { h2h: { home: 2.1, draw: 3.4, away: 3.25 }, totals: { line: 2.5, over: 1.85, under: 1.9 } }, ...over,
});

test('cotes : marge appliquée, arrondi en faveur de la maison', () => {
  const fair = [2, 4, 4]; // probabilités 50 / 25 / 25 %
  const priced = applyMargin(fair, 0.06);
  assert.deepEqual(priced, [1.88, 3.77, 3.77]);
  assert.ok(marginOf(priced) >= 0.06);
  assert.equal(roundOdds(1.009), 1.01);
  assert.equal(combinedOdds([1.45, 2.25, 1.7]), 5.54);
  assert.equal(potentialWin(2000, 5.54), 11_080);
  assert.equal(potentialWin(200_000, 100), SPORT_LIMITS.maxWin);
});

test('match : ouvert avant le coup d\'envoi seulement, issues et libellés', () => {
  assert.equal(isEventOpen(ev(), now), true);
  assert.equal(isEventOpen(ev(), new Date('2026-10-14T17:30:00Z')), false);
  assert.equal(isEventOpen(ev({ suspended: true }), now), false);
  assert.equal(isEventOpen(ev({ status: 'live' }), now), false);
  assert.equal(currentOdds(ev(), 'h2h', 'draw'), 3.4);
  assert.equal(currentOdds(ev({ markets: { h2h: { home: 2, away: 2, suspended: true } } }), 'h2h', 'home'), null);
  assert.equal(outcomeLabel(ev(), 'h2h', 'home'), 'Arsenal');
  assert.equal(outcomeLabel(ev(), 'totals', 'under'), 'Moins de 2.5');
  assert.deepEqual(marketOutcomes(ev({ sport: 'basketball' }), 'h2h'), ['home', 'away']);
});

test('coupon : simple, combiné, règles', () => {
  const a = { eventId: 'e1', market: 'h2h', outcome: 'home', odds: 2.1 };
  const b = { eventId: 'e2', market: 'h2h', outcome: 'away', odds: 1.5 };
  const single = buildTickets({ type: 'single', stake: 1000, selections: [a, b] });
  assert.equal(single.tickets.length, 2);
  assert.equal(single.totalStake, 2000);
  assert.equal(single.tickets[0].potentialWin, 2100);
  const combo = buildTickets({ type: 'combo', stake: 1000, selections: [a, b] });
  assert.equal(combo.tickets.length, 1);
  assert.equal(combo.tickets[0].totalOdds, 3.15);
  assert.equal(combo.tickets[0].potentialWin, 3150);
  assert.equal(buildTickets({ type: 'combo', stake: 1000, selections: [a] }).code, 'COMBO_TOO_SMALL');
  assert.equal(buildTickets({ type: 'combo', stake: 1000, selections: [a, { ...a, outcome: 'draw', odds: 3.4 }] }).code, 'COMBO_SAME_EVENT');
  assert.equal(buildTickets({ type: 'single', stake: 50, selections: [a] }).code, 'STAKE_TOO_LOW');
  assert.equal(buildTickets({ type: 'single', stake: 1000, selections: [] }).code, 'SLIP_EMPTY');
});

test('changement de cote ou match fermé détectés', () => {
  const events = { e1: ev({ markets: { h2h: { home: 2.0, draw: 3.4, away: 3.3 } } }), e2: ev({ id: 'e2', status: 'live' }) };
  const changes = oddsChanges([
    { eventId: 'e1', market: 'h2h', outcome: 'home', odds: 2.1 },
    { eventId: 'e1', market: 'h2h', outcome: 'draw', odds: 3.4 },
    { eventId: 'e2', market: 'h2h', outcome: 'home', odds: 2.1 },
  ], events, now);
  assert.equal(changes.length, 2);
  assert.equal(changes[0].newOdds, 2.0);
  assert.equal(changes[1].closed, true);
});

test('règlement des choix et des tickets', () => {
  const done = ev({ status: 'finished', score: { home: 2, away: 1 } });
  assert.equal(settleSelection({ market: 'h2h', outcome: 'home' }, done), 'won');
  assert.equal(settleSelection({ market: 'h2h', outcome: 'draw' }, done), 'lost');
  assert.equal(settleSelection({ market: 'totals', outcome: 'over', line: 2.5 }, done), 'won');
  assert.equal(settleSelection({ market: 'totals', outcome: 'over', line: 3 }, done), 'void');
  assert.equal(settleSelection({ market: 'h2h', outcome: 'home' }, ev({ status: 'cancelled' })), 'void');
  assert.equal(settleSelection({ market: 'h2h', outcome: 'home' }, ev()), 'pending');
  const sel = (status, odds) => ({ status, odds });
  assert.deepEqual(settleTicket({ stake: 1000, selections: [sel('won', 2), sel('won', 1.5)] }), { status: 'won', win: 3000, odds: 3 });
  assert.equal(settleTicket({ stake: 1000, selections: [sel('won', 2), sel('pending', 1.5)] }).status, 'pending');
  assert.equal(settleTicket({ stake: 1000, selections: [sel('pending', 2), sel('lost', 1.5)] }).status, 'lost');
  assert.deepEqual(settleTicket({ stake: 1000, selections: [sel('won', 2), sel('void', 1.5)] }), { status: 'won', win: 2000, odds: 2 });
  assert.deepEqual(settleTicket({ stake: 1000, selections: [sel('void', 2)] }), { status: 'void', win: 1000, odds: 1 });
  assert.equal(validateScore({ home: 2, away: 1 }).ok, true);
  assert.equal(validateScore({ home: -1, away: 1 }).ok, false);
});

test('The Odds API : moyenne des bookmakers, marge, total le plus courant, scores', () => {
  const api = {
    id: 'abc123', sport_key: 'soccer_epl', commence_time: '2026-10-14T17:30:00Z', home_team: 'Arsenal', away_team: 'Chelsea',
    bookmakers: [
      { key: 'b1', markets: [
        { key: 'h2h', outcomes: [{ name: 'Arsenal', price: 2.2 }, { name: 'Chelsea', price: 3.3 }, { name: 'Draw', price: 3.5 }] },
        { key: 'totals', outcomes: [{ name: 'Over', price: 1.9, point: 2.5 }, { name: 'Under', price: 1.9, point: 2.5 }] },
      ] },
      { key: 'b2', markets: [
        { key: 'h2h', outcomes: [{ name: 'Arsenal', price: 2.0 }, { name: 'Chelsea', price: 3.5 }, { name: 'Draw', price: 3.3 }] },
        { key: 'totals', outcomes: [{ name: 'Over', price: 2.0, point: 2.5 }, { name: 'Under', price: 1.8, point: 2.5 }] },
      ] },
      { key: 'b3', markets: [{ key: 'totals', outcomes: [{ name: 'Over', price: 1.5, point: 1.5 }, { name: 'Under', price: 2.5, point: 1.5 }] }] },
    ],
  };
  const e = parseOddsEvent(api, { sport: 'football', league: 'Premier League' }, 0.06);
  assert.equal(e.externalId, 'abc123');
  assert.equal(e.startAt.toISOString(), '2026-10-14T17:30:00.000Z');
  assert.equal(e.markets.totals.line, 2.5);
  const m = e.markets.h2h;
  assert.ok(Math.abs(marginOf([m.home, m.draw, m.away]) - 0.06) < 0.01);
  assert.ok(m.home < m.away);
  assert.equal(parseOddsEvent({ ...api, bookmakers: [] }, { sport: 'football', league: 'x' }), null);
  assert.deepEqual(parseScoreEvent({ id: 'abc123', completed: true, home_team: 'Arsenal', away_team: 'Chelsea', scores: [{ name: 'Chelsea', score: '1' }, { name: 'Arsenal', score: '2' }] }),
    { externalId: 'abc123', completed: true, score: { home: 2, away: 1 } });
  assert.equal(parseScoreEvent({ id: 'x', completed: false, home_team: 'A', away_team: 'B', scores: null }).score, null);
});
