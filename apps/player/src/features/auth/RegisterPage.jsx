import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Vous devez accepter les conditions');
      return;
    }

    setLoading(true);

    try {
      // TODO: Intégrer Firebase auth
      console.log('Register:', formData);
      
      // Simulation: redirect to SMS verification
      setTimeout(() => {
        navigate('/verification-sms');
      }, 500);
    } catch (err) {
      setError(err.message || 'Erreur d\'inscription');
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
          <h1>Inscription</h1>
          <div style={{ width: '44px' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {/* Name Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Prénom</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Jean"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Nom</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone Input */}
          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+228 XX XX XX XX"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Inputs */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Terms Checkbox */}
          <label className="checkbox">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
            />
            <span>
              J'accepte les{' '}
              <button type="button" className="link-btn">
                conditions d'utilisation
              </button>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Inscription...' : 'Créer un Compte'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          <p>
            Vous avez déjà un compte?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/connexion')}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
