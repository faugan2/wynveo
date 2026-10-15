import { useState } from 'react';
import { usePlayerSession } from '../../hooks/PlayerSession.jsx';

export function LoginPage() {
  const [tab, setTab] = useState('login'); // 'login' ou 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = usePlayerSession();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, fullName, phone);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Wynveo</h1>
        <p className="muted">Paris sportifs & Jeux de chance</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #eee' }}>
        <button
          type="button"
          className={`btn sm ${tab === 'login' ? 'active' : ''}`}
          onClick={() => setTab('login')}
          style={{ flex: 1, borderBottomWidth: tab === 'login' ? 2 : 0, borderBottomColor: 'var(--accent)' }}
        >
          Connexion
        </button>
        <button
          type="button"
          className={`btn sm ${tab === 'register' ? 'active' : ''}`}
          onClick={() => setTab('register')}
          style={{ flex: 1, borderBottomWidth: tab === 'register' ? 2 : 0, borderBottomColor: 'var(--accent)' }}
        >
          Inscription
        </button>
      </div>

      {error && <div className="notice bad" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={tab === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {tab === 'register' && (
          <>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 5 }}>Nom complet</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 5 }}>Téléphone</label>
              <input
                type="tel"
                placeholder="+228 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                required
              />
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 5 }}>E-mail</label>
          <input
            type="email"
            placeholder="vous@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 5 }}>Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            required
          />
        </div>

        <button
          type="submit"
          className="btn"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Chargement…' : tab === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: '#666' }}>
        18+ • Jouer comporte des risques • Jeu responsable
      </p>
    </div>
  );
}
