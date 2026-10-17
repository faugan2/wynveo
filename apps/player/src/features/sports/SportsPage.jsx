import { useState } from 'react';
import './SportsPage.css';

export function SportsPage() {
  const [selectedTab, setSelectedTab] = useState('live');
  const [selectedBets, setSelectedBets] = useState({});

  // Mock data
  const events = {
    live: [
      {
        id: 1,
        league: 'LIGUE 1',
        home: 'PSG',
        away: 'Lyon',
        time: '45+2',
        homeScore: 2,
        awayScore: 1,
        odds: { home: 1.5, draw: 3.2, away: 5.0 },
        live: true,
      },
      {
        id: 2,
        league: 'SERIE A',
        home: 'AC Milan',
        away: 'Inter',
        time: '20',
        homeScore: 0,
        awayScore: 0,
        odds: { home: 2.1, draw: 3.5, away: 3.0 },
        live: true,
      },
    ],
    upcoming: [
      {
        id: 3,
        league: 'LIGUE 1',
        home: 'Marseille',
        away: 'Toulouse',
        date: '2024-10-20 20:00',
        odds: { home: 1.8, draw: 3.3, away: 4.2 },
      },
      {
        id: 4,
        league: 'PREMIER LEAGUE',
        home: 'Manchester City',
        away: 'Arsenal',
        date: '2024-10-20 19:00',
        odds: { home: 2.0, draw: 3.4, away: 3.5 },
      },
      {
        id: 5,
        league: 'BUNDESLIGA',
        home: 'Bayern Munich',
        away: 'Borussia Dortmund',
        date: '2024-10-21 18:30',
        odds: { home: 1.6, draw: 3.8, away: 5.5 },
      },
    ],
  };

  const handleBetSelect = (eventId, selection) => {
    setSelectedBets({
      ...selectedBets,
      [eventId]: selection,
    });
  };

  const activeBets = Object.keys(selectedBets).length;

  return (
    <div className="sports-page">
      {/* Header */}
      <div className="page-header">
        <h1>Paris Sportifs</h1>
        <p className="page-subtitle">Pariez sur les meilleurs événements</p>
      </div>

      {/* Coupon Badge */}
      {activeBets > 0 && (
        <div className="coupon-badge">
          <span>🧾 Coupon: {activeBets} sélection{activeBets > 1 ? 's' : ''}</span>
          <button className="coupon-btn">Voir le coupon →</button>
        </div>
      )}

      {/* Tabs */}
      <div className="sports-tabs">
        <button
          className={`tab-btn ${selectedTab === 'live' ? 'active' : ''}`}
          onClick={() => setSelectedTab('live')}
        >
          🔴 En direct ({events.live.length})
        </button>
        <button
          className={`tab-btn ${selectedTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setSelectedTab('upcoming')}
        >
          ⏰ À venir ({events.upcoming.length})
        </button>
      </div>

      {/* Events List */}
      <div className="events-list">
        {(selectedTab === 'live' ? events.live : events.upcoming).map((event) => (
          <div key={event.id} className={`event-card ${event.live ? 'live' : ''}`}>
            {event.live && <div className="live-badge">🔴 EN DIRECT</div>}

            {/* Event Header */}
            <div className="event-header">
              <span className="league-badge">{event.league}</span>
              {event.live ? (
                <span className="time-badge">{event.time}'</span>
              ) : (
                <span className="date-badge">{new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>

            {/* Match */}
            <div className="match-section">
              <div className="team">
                <span className="team-name">{event.home}</span>
                {event.live && <span className="score">{event.homeScore}</span>}
              </div>

              <div className="center">
                {event.live ? (
                  <span className="vs">VS</span>
                ) : (
                  <span className="clock">🕐</span>
                )}
              </div>

              <div className="team">
                {event.live && <span className="score">{event.awayScore}</span>}
                <span className="team-name">{event.away}</span>
              </div>
            </div>

            {/* Odds */}
            <div className="odds-section">
              <button
                className={`odd-btn ${selectedBets[event.id] === 'home' ? 'selected' : ''}`}
                onClick={() => handleBetSelect(event.id, 'home')}
              >
                <span className="odd-text">{event.home}</span>
                <span className="odd-value">{event.odds.home}</span>
              </button>

              <button
                className={`odd-btn ${selectedBets[event.id] === 'draw' ? 'selected' : ''}`}
                onClick={() => handleBetSelect(event.id, 'draw')}
              >
                <span className="odd-text">Match Nul</span>
                <span className="odd-value">{event.odds.draw}</span>
              </button>

              <button
                className={`odd-btn ${selectedBets[event.id] === 'away' ? 'selected' : ''}`}
                onClick={() => handleBetSelect(event.id, 'away')}
              >
                <span className="odd-text">{event.away}</span>
                <span className="odd-value">{event.odds.away}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Modal - Simplified */}
      {activeBets > 0 && (
        <div className="coupon-summary">
          <h3>Résumé du coupon</h3>
          <div className="coupon-selections">
            {Object.entries(selectedBets).map(([eventId, selection]) => {
              const event = [...events.live, ...events.upcoming].find((e) => e.id === parseInt(eventId));
              if (!event) return null;
              return (
                <div key={eventId} className="coupon-item">
                  <span>{event.home} vs {event.away}</span>
                  <span className="selection-badge">{selection}</span>
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            Confirmer le coupon (3 sélections)
          </button>
        </div>
      )}
    </div>
  );
}
