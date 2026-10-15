import { useState } from 'react';
import { Kpi } from '../../ui/index.jsx';
import './GamesPage.css';

const mockGames = [
  { id: 'g1', name: 'Roulette', category: 'Casino', status: 'active', players: 342, dailyRevenue: 45000 },
  { id: 'g2', name: 'Blackjack', category: 'Casino', status: 'active', players: 218, dailyRevenue: 32000 },
  { id: 'g3', name: 'Poker', category: 'Casino', status: 'active', players: 156, dailyRevenue: 28000 },
  { id: 'g4', name: 'Crash', category: 'Provably Fair', status: 'active', players: 512, dailyRevenue: 78000 },
  { id: 'g5', name: 'Mines', category: 'Provably Fair', status: 'active', players: 289, dailyRevenue: 42000 },
  { id: 'g6', name: 'Aviator', category: 'Provably Fair', status: 'maintenance', players: 0, dailyRevenue: 0 },
];

export function GamesPage() {
  const [games, setGames] = useState(mockGames);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = ['Casino', 'Provably Fair'];
  const filtered = selectedCategory ? games.filter((g) => g.category === selectedCategory) : games;

  const activeCount = games.filter((g) => g.status === 'active').length;
  const totalPlayers = games.reduce((s, g) => s + g.players, 0);
  const totalRevenue = games.reduce((s, g) => s + g.dailyRevenue, 0);

  const handleStatusChange = (gameId, newStatus) => {
    setGames(games.map((g) => (g.id === gameId ? { ...g, status: newStatus } : g)));
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Jeux & Divertissements</h1>

      <div className="kpis">
        <Kpi label="Jeux actifs" value={activeCount} />
        <Kpi label="Joueurs actifs" value={totalPlayers} />
        <Kpi label="Revenu (jour)" value={`${(totalRevenue / 1000).toFixed(0)}K`} />
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: 20 }}>
        <h2 style={{ marginBottom: '1rem' }}>Filtrer par catégorie</h2>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn sm ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Tous ({games.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn sm ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} ({games.filter((g) => g.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: 20 }}>
        <h2 style={{ marginBottom: '1rem' }}>Liste des jeux</h2>

        <div className="table-wrap">
          <table className="data" style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th>Jeu</th>
                <th>Catégorie</th>
                <th className="num">Joueurs actifs</th>
                <th className="num">Revenu (jour)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((game) => (
                <tr key={game.id} style={{ opacity: game.status === 'active' ? 1 : 0.6 }}>
                  <td><b>{game.name}</b></td>
                  <td className="small">{game.category}</td>
                  <td className="num">{game.players}</td>
                  <td className="num" style={{ color: '#27ae60', fontWeight: 600 }}>
                    +{(game.dailyRevenue / 1000).toFixed(1)}K
                  </td>
                  <td>
                    <span className={`badge ${game.status === 'active' ? 'good' : 'neutral'}`}>
                      {game.status === 'active' ? 'Actif' : 'Maintenance'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    <button
                      type="button"
                      className="btn xs"
                      onClick={() =>
                        handleStatusChange(game.id, game.status === 'active' ? 'maintenance' : 'active')
                      }
                    >
                      {game.status === 'active' ? 'Arrêter' : 'Démarrer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
