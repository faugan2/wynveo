import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Intégrer Firebase auth
      console.log('Login:', { email, password });
      
      // Simulation: redirect to SMS verification
      setTimeout(() => {
        navigate('/verification-sms');
      }, 500);
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <button
            className="btn-back"
            onClick={() => navigate('/')}
            title="Retour"
          >
            ←
          </button>
          <h1>Connexion</h1>
          <div style={{ width: '44px' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Remember & Forgot */}
          <div className="auth-links">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Se souvenir de moi</span>
            </label>
            <button type="button" className="link-btn">
              Mot de passe oublié?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se Connecter'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          <p>
            Pas encore de compte?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/inscription')}
            >
              S'inscrire
            </button>
          </p>
        </div>

        {/* Divider & Social (optionnel) */}
        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button className="btn-social">
          <span>📱</span> Connexion avec Téléphone
        </button>
      </div>
    </div>
  );
}
