/**
 * Paris sportifs : sports proposés, marchés et limites.
 * Les paris se font avant le coup d'envoi uniquement (pas de pari en direct).
 */

export const SPORTS = Object.freeze({
  football: { id: 'football', label: 'Football', icon: '⚽', hasDraw: true, defaultTotalsLine: 2.5, totalsLabel: 'Total de buts' },
  basketball: { id: 'basketball', label: 'Basket', icon: '🏀', hasDraw: false, defaultTotalsLine: 215.5, totalsLabel: 'Total de points' },
  tennis: { id: 'tennis', label: 'Tennis', icon: '🎾', hasDraw: false, defaultTotalsLine: 22.5, totalsLabel: 'Total de jeux' },
});

export const MARKET = Object.freeze({ H2H: 'h2h', TOTALS: 'totals' });

export const MARKET_LABEL = Object.freeze({ h2h: 'Résultat du match', totals: 'Total de points' });

/** Nom du marché adapté au sport (« Total de buts » au football). */
export function marketLabel(sport, market) {
  return market === MARKET.TOTALS ? SPORTS[sport]?.totalsLabel ?? MARKET_LABEL.totals : MARKET_LABEL[market];
}

export const OUTCOME = Object.freeze({ HOME: 'home', DRAW: 'draw', AWAY: 'away', OVER: 'over', UNDER: 'under' });

export const EVENT_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
});

export const SPORT_LIMITS = Object.freeze({
  minStake: 100,
  maxStake: 200_000,
  quickStakes: [500, 1_000, 2_000, 5_000],
  maxSelections: 10,
  minOdds: 1.01,
  maxWin: 5_000_000,
  /** Marge par défaut appliquée aux cotes importées (6 %). */
  defaultMargin: 0.06,
  /** Les paris ferment à l'heure du coup d'envoi. */
  closeBeforeStartSeconds: 0,
});

/**
 * Compétitions importées depuis The Odds API (clé "sport_key" de l'API).
 * Modifiable sans toucher au reste du code.
 */
export const ODDS_API_COMPETITIONS = Object.freeze([
  { key: 'soccer_epl', sport: 'football', league: 'Premier League' },
  { key: 'soccer_france_ligue_one', sport: 'football', league: 'Ligue 1' },
  { key: 'soccer_spain_la_liga', sport: 'football', league: 'LaLiga' },
  { key: 'soccer_italy_serie_a', sport: 'football', league: 'Serie A' },
  { key: 'soccer_uefa_champs_league', sport: 'football', league: 'Ligue des champions' },
  { key: 'basketball_nba', sport: 'basketball', league: 'NBA' },
]);
