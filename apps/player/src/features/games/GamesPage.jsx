import { useState } from 'react';
import { formatFCFA } from '@wynveo/core';
import { useGames } from '../../hooks/useGames.js';

export function GamesPage() {
  const { loading, error, playLuckyNumbers, playJackpot, playBox } = useGames();
  const [activeGame, setActiveGame] = useState(null);
  const [result, setResult] = useState(null);

  // Lucky Numbers state
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [luckyAmount, setLuckyAmount] = useState('');

  // Jackpot state
  const [jackpotAmount, setJackpotAmount] = useState('');

  // Box state
  const [boxSelection, setBoxSelection] = useState('');
  const [boxAmount, setBoxAmount] = useState('');

  const handlePlayLuckyNumbers = async (e) => {
    e.preventDefault();
    try {
      const res = await playLuckyNumbers(selectedNumbers, parseInt(luckyAmount));
      setResult(res);
      setSelectedNumbers([]);
      setLuckyAmount('');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handlePlayJackpot = async (e) => {
    e.preventDefault();
    try {
      const res = await playJackpot(parseInt(jackpotAmount));
      setResult(res);
      setJackpotAmount('');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handlePlayBox = async (e) => {
    e.preventDefault();
    try {
      const res = await playBox(boxSelection, parseInt(boxAmount));
      setResult(res);
      setBoxSelection('');
      setBoxAmount('');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  if (error) return <p className="notice bad">{error}</p>;

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>🎮 Jeux</h1>

      {result && (
        <div style={{ padding: 20, backgroundColor: result.won ? '#e8f5e9' : '#fff3e0', borderRadius: 8, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, color: result.won ? '#27ae60' : '#f39c12' }}>
            {result.won ? '🎉 Vous avez gagné!' : '😢 Perdu'}
          </h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: result.won ? '#27ae60' : '#333' }}>
            {formatFCFA(result.payout)}
          </p>
          <button type="button" className="btn sm" onClick={() => setResult(null)}>
            Fermer
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
        {/* Lucky Numbers */}
        <form onSubmit={handlePlayLuckyNumbers} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Lucky Numbers</h3>
          <p className="small muted">Choisissez 3 numéros (1-50)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 15, maxHeight: 200, overflowY: 'auto' }}>
            {Array.from({ length: 50 }).map((_, i) => {
              const num = i + 1;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedNumbers((prev) => prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].slice(-3))}
                  style={{
                    padding: 10,
                    backgroundColor: selectedNumbers.includes(num) ? 'var(--accent)' : '#f5f5f5',
                    color: selectedNumbers.includes(num) ? 'white' : '#333',
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: selectedNumbers.includes(num) ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <input
            type="number"
            placeholder="Montant"
            value={luckyAmount}
            onChange={(e) => setLuckyAmount(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, marginBottom: 10 }}
            required
          />
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Jeu…' : 'Jouer (x5)'}
          </button>
        </form>

        {/* Jackpot */}
        <form onSubmit={handlePlayJackpot} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Jackpot</h3>
          <p className="small muted">Gros gains possibles!</p>
          <input
            type="number"
            placeholder="Montant"
            value={jackpotAmount}
            onChange={(e) => setJackpotAmount(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, marginBottom: 10 }}
            required
          />
          <div style={{ padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4, marginBottom: 10, fontSize: '0.9rem' }}>
            <div>95%+: x50</div>
            <div>85-95%: x10</div>
            <div>70-85%: x2</div>
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Jeu…' : 'Jouer'}
          </button>
        </form>

        {/* Box */}
        <form onSubmit={handlePlayBox} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Box</h3>
          <p className="small muted">Devinez le numéro (0-9)</p>
          <select
            value={boxSelection}
            onChange={(e) => setBoxSelection(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, marginBottom: 10 }}
            required
          >
            <option value="">Choisir un numéro…</option>
            {Array.from({ length: 10 }).map((_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Montant"
            value={boxAmount}
            onChange={(e) => setBoxAmount(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, marginBottom: 10 }}
            required
          />
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Jeu…' : 'Jouer (x9)'}
          </button>
        </form>
      </div>
    </>
  );
}
