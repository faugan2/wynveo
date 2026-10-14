/**
 * Lecture des réponses de The Odds API (v4), sans appel réseau.
 *   GET /v4/sports/{sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal
 *   GET /v4/sports/{sport}/scores?daysFrom=1
 * On fait la moyenne des cotes des bookmakers, puis on applique notre marge.
 */
import { applyMargin, roundOdds } from './rules.js';
import { SPORTS, SPORT_LIMITS } from './config.js';

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function outcomesFor(bookmakers, marketKey) {
  return bookmakers.flatMap((b) => (b.markets ?? []).filter((m) => m.key === marketKey).map((m) => m.outcomes ?? []));
}

/** Événement API -> match Wynveo (ou null si aucune cote exploitable). */
export function parseOddsEvent(api, competition, margin = SPORT_LIMITS.defaultMargin) {
  const sport = SPORTS[competition.sport];
  const books = api.bookmakers ?? [];
  const h2hSets = outcomesFor(books, 'h2h');
  if (!h2hSets.length) return null;
  const priceOf = (sets, name) => {
    const prices = sets.map((os) => os.find((o) => o.name === name)?.price).filter((p) => p > 1);
    return prices.length ? avg(prices) : null;
  };
  const home = priceOf(h2hSets, api.home_team);
  const away = priceOf(h2hSets, api.away_team);
  const draw = sport.hasDraw ? priceOf(h2hSets, 'Draw') : null;
  if (!home || !away || (sport.hasDraw && !draw)) return null;
  const h2hRaw = sport.hasDraw ? [home, draw, away] : [home, away];
  const h2h = applyMargin(h2hRaw, margin);
  const markets = {
    h2h: sport.hasDraw ? { home: h2h[0], draw: h2h[1], away: h2h[2], suspended: false } : { home: h2h[0], away: h2h[1], suspended: false },
  };

  // Total : on garde la ligne la plus proposée par les bookmakers.
  const totalSets = outcomesFor(books, 'totals');
  if (totalSets.length) {
    const counts = new Map();
    totalSets.forEach((os) => { const p = os[0]?.point; if (p !== undefined) counts.set(p, (counts.get(p) ?? 0) + 1); });
    const line = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const atLine = totalSets.filter((os) => os[0]?.point === line);
    const over = priceOf(atLine, 'Over');
    const under = priceOf(atLine, 'Under');
    if (line !== undefined && over && under) {
      const [o, u] = applyMargin([over, under], margin);
      markets.totals = { line, over: o, under: u, suspended: false };
    }
  }

  return {
    externalId: api.id,
    sport: competition.sport,
    league: competition.league,
    home: api.home_team,
    away: api.away_team,
    startAt: new Date(api.commence_time),
    markets,
  };
}

/** Score API -> { externalId, completed, score: { home, away } | null }. */
export function parseScoreEvent(api) {
  const find = (name) => api.scores?.find((s) => s.name === name)?.score;
  const h = find(api.home_team);
  const a = find(api.away_team);
  const score = h !== undefined && a !== undefined ? { home: Number.parseInt(h, 10), away: Number.parseInt(a, 10) } : null;
  return { externalId: api.id, completed: Boolean(api.completed), score: score && !Number.isNaN(score.home) && !Number.isNaN(score.away) ? score : null };
}

export { roundOdds };
