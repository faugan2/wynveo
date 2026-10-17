import './DashboardPage.css';

export function DashboardPage() {
  // Mock data - en production: vient de Firestore/API
  const player = {
    fullName: 'Kossi Amouzou',
    balance: 125000,
    totalDeposited: 500000,
    totalWithdrawn: 375000,
    bonus: 2000,
    withdrawable: 123000,
  };

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="hero-greeting">
          <h1 className="hero-title">Bienvenue, {player.fullName}! 👋</h1>
          <p className="hero-subtitle">Écrans 05 à 09 • le solde est partagé entre Jeux et Sport</p>
        </div>
      </section>

      {/* Balance Stats */}
      <section className="dashboard-stats">
        <div className="stat-card stat-card-teal">
          <div className="stat-label">Solde disponible</div>
          <div className="stat-value">{player.balance.toLocaleString('fr-FR')} FCFA</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-label">Retraitable</div>
          <div className="stat-value">{player.withdrawable.toLocaleString('fr-FR')} FCFA</div>
          <div className="stat-info">Min: 1 000</div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-label">Bonus</div>
          <div className="stat-value">{player.bonus.toLocaleString('fr-FR')} FCFA</div>
          <div className="stat-info">À miser avant retrait</div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-actions">
        <h2 className="section-title">Que veux-tu faire?</h2>
        
        <div className="actions-grid">
          <button className="action-card action-card-orange">
            <span className="action-icon">💳</span>
            <span className="action-label">Dépôt/Retrait</span>
          </button>

          <button className="action-card action-card-teal">
            <span className="action-icon">⚽</span>
            <span className="action-label">Paris sportifs</span>
          </button>

          <button className="action-card action-card-purple">
            <span className="action-icon">🎮</span>
            <span className="action-label">Jeux</span>
          </button>

          <button className="action-card action-card-blue">
            <span className="action-icon">👤</span>
            <span className="action-label">Profil</span>
          </button>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="dashboard-shortcuts">
        <div className="shortcut-card shortcut-jackpot">
          <div className="shortcut-content">
            <div className="shortcut-icon">🎰</div>
            <div className="shortcut-info">
              <h3>Jackpot du jour</h3>
              <p>2 500 000 FCFA</p>
            </div>
          </div>
          <span className="shortcut-time">Tirage: 20:00</span>
        </div>

        <div className="shortcut-card shortcut-live">
          <div className="shortcut-content">
            <div className="shortcut-icon">⚽</div>
            <div className="shortcut-info">
              <h3>12 matchs en direct</h3>
              <p>Foot, basket, tennis</p>
            </div>
          </div>
          <span className="shortcut-action">→</span>
        </div>
      </section>
    </div>
  );
}
