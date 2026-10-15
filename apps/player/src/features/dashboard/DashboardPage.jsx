import { Link } from 'react-router-dom';
import { usePlayerSession } from '../../hooks/PlayerSession.jsx';
import { formatFCFA } from '@wynveo/core';

export function DashboardPage() {
  const { player } = usePlayerSession();

  const mockStats = {
    balance: 125000,
    totalDeposited: 500000,
    totalWithdrawn: 375000,
    totalStaked: 892000,
    totalWon: 650000,
  };

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Bienvenue, {player?.fullName}!</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <div className="small muted">Solde</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#27ae60' }}>{formatFCFA(mockStats.balance)}</div>
        </div>
        <div style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <div className="small muted">Total dépôts</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{formatFCFA(mockStats.totalDeposited)}</div>
        </div>
        <div style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <div className="small muted">Gains</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#27ae60' }}>{formatFCFA(mockStats.totalWon)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <Link to="/portefeuille" style={{ textDecoration: 'none' }}>
          <button type="button" className="btn" style={{ width: '100%', padding: 20 }}>
            💰 Dépôt/Retrait
          </button>
        </Link>
        <Link to="/sports" style={{ textDecoration: 'none' }}>
          <button type="button" className="btn" style={{ width: '100%', padding: 20 }}>
            ⚽ Paris sportifs
          </button>
        </Link>
        <Link to="/jeux" style={{ textDecoration: 'none' }}>
          <button type="button" className="btn" style={{ width: '100%', padding: 20 }}>
            🎮 Jeux
          </button>
        </Link>
        <Link to="/profil" style={{ textDecoration: 'none' }}>
          <button type="button" className="btn" style={{ width: '100%', padding: 20 }}>
            👤 Profil
          </button>
        </Link>
      </div>
    </>
  );
}
