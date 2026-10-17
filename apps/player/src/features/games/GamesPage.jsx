import { useState } from 'react';
import './GamesPage.css';

export function GamesPage() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [betAmount, setBetAmount] = useState('1000');

  const games = [
    {
      id: 'lucky-spin',
      name: 'Lucky Spin',
      description: 'Faites tourner la roue de la chance',
      icon: '🎡',
      color: 'orange',
      minBet: 100,
      maxBet: 50000,
      multipliers: [1, 2, 5, 10, 20, 50],
    },
    {
      id: 'mystery-box',
      name: 'Mystery Box',
      description: '9 coffres mystérieux à ouvrir',
      icon: '🎁',
      color: 'purple',
      minBet: 500,
      maxBet: 100000,
      prizes: 9,
    },
    {
      id: 'lucky-number',
      name: 'Lucky Number',
      description: 'Devinez le nombre de 1 à 50',
      icon: '🎯',
      color: 'green',
      minBet: 200,
      maxBet: 50000,
      multiplier: 5,
    },
    {
      id: 'jackpot',
      name: 'Jackpot Daily',
      description: 'Gagnez jusqu\'à 10 000 FCFA',
      icon: '🏆',
      color: 'blue',
      minBet: 100,
      maxBet: 100000,
      winRate: '1 sur 100',
    },
  ];

  return (
    <div className="games-page">
      {/* Header */}
      <div className="page-header">
        <h1>Jeux Instantanés</h1>
        <p className="page-subtitle">Jouez et gagnez instantanément</p>
      </div>

      {!selectedGame ? (
        <>
          {/* Games Grid */}
          <div className="games-grid">
            {games.map((game) => (
              <div
                key={game.id}
                className={`game-card ${game.color}`}
                onClick={() => setSelectedGame(game)}
              >
                <div className="game-icon">{game.icon}</div>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <button className="game-btn">Jouer →</button>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="info-section">
            <h3>🎮 Comment ça marche?</h3>
            <div className="steps">
              <div className="step">
                <span className="step-num">1</span>
                <span>Choisissez un jeu</span>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <span>Définissez votre mise</span>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <span>Jouez et gagnez!</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="game-detail">
          {/* Back Button */}
          <button
            className="btn-back-game"
            onClick={() => setSelectedGame(null)}
          >
            ← Retour aux jeux
          </button>

          {/* Game Info */}
          <div className="game-detail-header">
            <div className="game-detail-icon">{selectedGame.icon}</div>
            <div>
              <h2>{selectedGame.name}</h2>
              <p>{selectedGame.description}</p>
            </div>
          </div>

          {/* Bet Form */}
          <div className="bet-form-container">
            <div className="form-group">
              <label>Montant de la mise (FCFA)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min={selectedGame.minBet}
                max={selectedGame.maxBet}
              />
              <small>Min: {selectedGame.minBet} | Max: {selectedGame.maxBet}</small>
            </div>

            {/* Game Preview */}
            <div className="game-preview">
              {selectedGame.id === 'lucky-spin' && (
                <div className="preview-content">
                  <div className="wheel">🎡</div>
                  <p>Cliquez sur "Jouer" pour faire tourner la roue</p>
                  <div className="multipliers">
                    {selectedGame.multipliers.map((m) => (
                      <span key={m} className="multiplier">
                        x{m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedGame.id === 'mystery-box' && (
                <div className="preview-content">
                  <div className="boxes">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="box">🎁</div>
                    ))}
                  </div>
                  <p>Découvrez les 9 coffres mystérieux</p>
                </div>
              )}

              {selectedGame.id === 'lucky-number' && (
                <div className="preview-content">
                  <div className="number-grid">
                    {[...Array(50)].map((_, i) => (
                      <button key={i + 1} className="number-btn">
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <p>Gagnez {selectedGame.multiplier}x votre mise</p>
                </div>
              )}

              {selectedGame.id === 'jackpot' && (
                <div className="preview-content">
                  <div className="jackpot-display">
                    <span className="jackpot-amount">2.5M FCFA</span>
                    <span className="win-chance">1 chance sur 100</span>
                  </div>
                  <p>Tirage à 20h00 chaque jour</p>
                </div>
              )}
            </div>

            {/* Play Button */}
            <button className="btn btn-primary btn-lg">
              💰 Jouer avec {parseInt(betAmount).toLocaleString()} FCFA
            </button>

            {/* Info Box */}
            <div className="info-box">
              <h4>📋 Règles du jeu</h4>
              {selectedGame.id === 'lucky-spin' && (
                <p>Vous pouvez gagner jusqu'à 50x votre mise! Les multipliers sont aléatoires.</p>
              )}
              {selectedGame.id === 'mystery-box' && (
                <p>Ouvrez des coffres pour trouver des gains. Certains coffres peuvent être vides.</p>
              )}
              {selectedGame.id === 'lucky-number' && (
                <p>Devinez le nombre correct pour gagner 5x votre mise.</p>
              )}
              {selectedGame.id === 'jackpot' && (
                <p>Le tirage se fait automatiquement chaque jour à 20h. Vous pouvez cumuler plusieurs billets.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
