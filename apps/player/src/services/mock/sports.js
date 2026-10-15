const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const mockEvents = [
  { id: 'sp1', sport: 'football', league: 'Premier League', home: 'Arsenal', away: 'Chelsea', startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), markets: { h2h: { home: 1.92, draw: 3.55, away: 3.85 }, totals: { line: 2.5, over: 1.79, under: 1.97 } } },
  { id: 'sp2', sport: 'football', league: 'La Liga', home: 'Barcelona', away: 'Real Madrid', startAt: new Date(Date.now() + 4 * 60 * 60 * 1000), markets: { h2h: { home: 2.10, draw: 3.20, away: 3.50 } } },
  { id: 'sp3', sport: 'basketball', league: 'NBA', home: 'Lakers', away: 'Celtics', startAt: new Date(Date.now() + 8 * 60 * 60 * 1000), markets: { h2h: { home: 1.80, away: 2.00 } } },
];

export const sportsService = {
  async getEvents() {
    await delay();
    return mockEvents;
  },

  async placeBet(uid, { eventId, selection, amount }) {
    await delay(800);
    const event = mockEvents.find((e) => e.id === eventId);
    if (!event) throw new Error('Événement non trouvé');
    return {
      id: `bet_${Date.now()}`,
      eventId,
      selection,
      amount,
      odds: 2.50,
      potentialWin: amount * 2.50,
      status: 'active',
      placedAt: new Date(),
    };
  },
};
