import { useState } from 'react';
import { formatFCFA } from '@wynveo/core';
import { useSports } from '../../hooks/useSports.js';

const WHEN = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export function SportsPage() {
  const { events, loading, error, placeBet } = useSports();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selection, setSelection] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePlaceBet = async (e) => {
    e.preventDefault();
    if (!selection || !amount) return;
    setSubmitting(true);
    try {
      await placeBet(selectedEvent.id, selection, parseInt(amount));
      alert('Pari placé avec succès!');
      setSelectedEvent(null);
      setSelection(null);
      setAmount('');
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Chargement des matchs…</p>;

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>⚽ Paris sportifs</h1>

      {error && <div className="notice bad" style={{ marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1fr 350px' : '1fr', gap: 20 }}>
        <div>
          {events && events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              style={{
                padding: 15,
                marginBottom: 15,
                border: selectedEvent?.id === event.id ? '2px solid var(--accent)' : '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                backgroundColor: selectedEvent?.id === event.id ? '#f0f7ff' : 'white',
              }}
            >
              <div className="small muted">{event.league}</div>
              <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0' }}>
                {event.home} vs {event.away}
              </div>
              <div className="small muted">{WHEN.format(event.startAt)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10, fontSize: '0.9rem' }}>
                <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <div className="small muted">{event.home}</div>
                  <div style={{ fontWeight: 700 }}>{event.markets.h2h.home}</div>
                </div>
                {event.markets.h2h.draw && (
                  <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    <div className="small muted">Nul</div>
                    <div style={{ fontWeight: 700 }}>{event.markets.h2h.draw}</div>
                  </div>
                )}
                <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <div className="small muted">{event.away}</div>
                  <div style={{ fontWeight: 700 }}>{event.markets.h2h.away}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedEvent && (
          <form onSubmit={handlePlaceBet} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Passer un pari</h3>
              <div style={{ marginBottom: 15 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 5 }}>Sélection</label>
                <select
                  value={selection || ''}
                  onChange={(e) => setSelection(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                  required
                >
                  <option value="">Choisir…</option>
                  <option value="home">{selectedEvent.home} ({selectedEvent.markets.h2h.home})</option>
                  {selectedEvent.markets.h2h.draw && <option value="draw">Nul ({selectedEvent.markets.h2h.draw})</option>}
                  <option value="away">{selectedEvent.away} ({selectedEvent.markets.h2h.away})</option>
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 5 }}>Montant</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                  required
                />
              </div>
              {selection && amount && (
                <div style={{ padding: 10, backgroundColor: 'white', borderRadius: 4, marginBottom: 15 }}>
                  <div className="small muted">Gain potentiel</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#27ae60' }}>
                    {formatFCFA(parseInt(amount) * (selectedEvent.markets.h2h[selection] || 1))}
                  </div>
                </div>
              )}
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Placement…' : 'Parier'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
