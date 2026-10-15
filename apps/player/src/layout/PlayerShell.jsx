import { NavLink, Outlet } from 'react-router-dom';
import { usePlayerSession } from '../hooks/PlayerSession.jsx';

const MENU = [
  { to: '/', label: '🏠 Accueil', end: true },
  { to: '/portefeuille', label: '💰 Portefeuille' },
  { to: '/sports', label: '⚽ Sports' },
  { to: '/jeux', label: '🎮 Jeux' },
  { to: '/profil', label: '👤 Profil' },
];

export function PlayerShell() {
  const { player, signOut } = usePlayerSession();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Wynveo</h1>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span className="small muted">{player?.fullName}</span>
            <button type="button" className="btn sm" onClick={signOut}>
              Déco
            </button>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', flex: 1 }}>
        <nav style={{ padding: '1rem', backgroundColor: '#fafafa', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) => `btn sm ${isActive ? 'active' : ''}`}
              style={{ textAlign: 'left', padding: '10px', textDecoration: 'none' }}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
