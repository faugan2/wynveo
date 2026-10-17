import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

export function SMSVerificationPage() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  // Timer for resend
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = codes.join('');

    if (code.length !== 6) {
      setError('Veuillez entrer les 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Intégrer Firebase verification
      console.log('SMS Code:', code);
      
      // Simulation: redirect to dashboard
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      setError('Code invalide');
      setLoading(false);
    }
  };

  const handleResend = () => {
    setResendTimer(60);
    setCodes(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    // TODO: Resend SMS
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <button
            className="btn-back"
            onClick={() => navigate(-1)}
            title="Retour"
          >
            ←
          </button>
          <h1>Vérification SMS</h1>
          <div style={{ width: '44px' }} />
        </div>

        {/* Info */}
        <div className="auth-info">
          <p>Un code de vérification a été envoyé à votre téléphone.</p>
          <p className="phone-info">+228 XXXXXXX789</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {/* Code Inputs */}
          <div className="code-inputs">
            {codes.map((code, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={code}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="code-input"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>
        </form>

        {/* Resend Section */}
        <div className="auth-resend">
          {resendTimer > 0 ? (
            <p className="resend-timer">
              Renvoyer le code dans {resendTimer}s
            </p>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={handleResend}
            >
              Renvoyer le code
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="auth-help">
          <p>Vous n'avez pas reçu le code? Vérifiez votre spam ou vos paramètres SMS.</p>
        </div>
      </div>
    </div>
  );
}
