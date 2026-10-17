import { usePlayerSession } from '../hooks/PlayerSession.jsx';
import '../theme.css';
import './PlayerShell.css';

export function PlayerShell({ children }) {
  const { player, signOut } = usePlayerSession();

  const handleLogout = () => {
    if (confirm('Tu veux te déconnecter?')) {
      signOut();
    }
  };

  return (
    <div className="player-shell">
      {/* Header */}
      <header className="shell-header">
        <div className="shell-header-content">
          <div className="shell-branding">
            <span className="wynveo-logo">W</span>
            <span className="wynveo-name">WYNVEO</span>
          </div>

          <div className="shell-player-info">
            {player && (
              <>
                <span className="player-name">{player.fullName || 'Joueur'}</span>
                <button className="btn-logout" onClick={handleLogout}>
                  Déco
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="shell-container">
        {/* Sidebar Navigation */}
        <aside className="shell-sidebar">
          <nav className="shell-nav">
            <a href="#/" className="nav-link">
              <span className="nav-icon">🏠</span>
              <span className="nav-label">Accueil</span>
            </a>
            <a href="#/portefeuille" className="nav-link">
              <span className="nav-icon">💰</span>
              <span className="nav-label">Portefeuille</span>
            </a>
            <a href="#/sports" className="nav-link">
              <span className="nav-icon">⚽</span>
              <span className="nav-label">Sports</span>
            </a>
            <a href="#/jeux" className="nav-link">
              <span className="nav-icon">🎮</span>
              <span className="nav-label">Jeux</span>
            </a>
            <a href="#/profil" className="nav-link">
              <span className="nav-icon">👤</span>
              <span className="nav-label">Profil</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="shell-main">
          <div className="shell-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
