import { useState } from 'react';
import { adminAuthService } from '../../services/index.js';
import { useAdminSession } from '../../hooks/AdminSession.jsx';
import { Brand } from '../../ui/index.jsx';

export function LoginPage() {
  const { denied } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setPending(true); setError(null);
    try { await adminAuthService.signIn(email.trim(), password); } catch (err) { setError(err.message); } finally { setPending(false); }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div><Brand size={32} /> <span style={{ marginLeft: 8, fontSize: 13, letterSpacing: '0.1em', color: '#b9b3e6', fontWeight: 700 }}>ADMINISTRATION</span></div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1, textTransform: 'uppercase' }}>Pilotez Jeux et Sport depuis un seul espace</h1>
          <p style={{ color: '#b9b3e6', marginTop: 12, maxWidth: 440, fontSize: 15 }}>Chaque action est enregistrée dans le journal d'audit.</p>
        </div>
        <div style={{ color: '#7d76b8', fontSize: 12 }}>Accès réservé au personnel autorisé.</div>
      </div>
      <div className="login-side">
        <form className="card" style={{ width: '100%', maxWidth: 400, padding: 30, display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={submit}>
          <div className="login-mobile-brand"><Brand /> <span style={{ marginLeft: 6, fontSize: 11, letterSpacing: '0.1em', color: '#b9b3e6', fontWeight: 700 }}>ADMINISTRATION</span></div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Connexion</h2>
          <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="label" htmlFor="password">Mot de passe</label><input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {(error || denied) && <p className="error" role="alert">{error || denied}</p>}
          <button type="submit" className="btn primary" style={{ padding: 12, fontSize: 14 }} disabled={pending}>{pending ? 'Connexion…' : 'Se connecter'}</button>
          <p className="small muted" style={{ textAlign: 'center' }}>Mot de passe oublié ? Contactez un super admin.</p>
        </form>
      </div>
    </div>
  );
}
