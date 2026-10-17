import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-content">
          {/* Logo & Title */}
          <div className="welcome-header">
            <div className="welcome-logo">
              <span className="logo-gradient">W</span>
            </div>
            <h1 className="welcome-title">Wynveo</h1>
            <p className="welcome-subtitle">Sports & Gaming Platform</p>
          </div>

          {/* Features */}
          <div className="welcome-features">
            <div className="feature-item">
              <div className="feature-icon">⚽</div>
              <div>
                <h3>Paris Sportifs</h3>
                <p>Pariez sur les meilleurs événements</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🎰</div>
              <div>
                <h3>Jeux Instantanés</h3>
                <p>Lucky Spin, Mystery Box & plus</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <div>
                <h3>Jackpot Quotidien</h3>
                <p>Gagnez jusqu'à 2.5M FCFA</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <div>
                <h3>Paiements Faciles</h3>
                <p>Dépôts et retraits instantanés</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="welcome-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/connexion')}
            >
              Se Connecter
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/inscription')}
            >
              Créer un Compte
            </button>
          </div>

          {/* Footer Text */}
          <p className="welcome-footer">
            Bienvenue sur la meilleure plateforme de jeu africaine
          </p>
        </div>

        {/* Background Elements */}
        <div className="welcome-bg-gradient"></div>
      </div>
    </div>
  );
}
