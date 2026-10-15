import { Link } from 'react-router-dom';
import { formatAmount, formatFCFA, OPERATORS, TX_STATUS_LABEL, statusTone } from '@wynveo/core';
import { Badge, Empty, Kpi } from '../../ui/index.jsx';
import { usePendingWithdrawals, useRecentWithdrawals } from '../../hooks/useWithdrawals.js';

const TIME = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function DashboardPage() {
  const pending = usePendingWithdrawals();
  const recent = useRecentWithdrawals(10);
  const oldest = pending.items[0];
  const waitMin = oldest ? Math.round((Date.now() - oldest.createdAt) / 60_000) : 0;

  // Mock data for demo
  const mockStats = {
    activeUsers: 1247,
    totalDeposited: 434000,
    totalWithdrawn: 75000,
    platformBalance: 359000,
    totalStaked: 892000,
    totalWon: 650000,
    roi: 20.3,
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Tableau de bord</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Kpi label="Utilisateurs actifs" value={mockStats.activeUsers} hint="30 jours" />
        <Kpi label="Total dépôts" value={formatFCFA(mockStats.totalDeposited)} hint="Historique complet" />
        <Kpi label="Total retraits" value={formatFCFA(mockStats.totalWithdrawn)} hint={`${Math.round((mockStats.totalWithdrawn / mockStats.totalDeposited) * 100)}% dépôts`} />
        <Kpi label="Solde plateforme" value={formatFCFA(mockStats.platformBalance)} hint="Net" tone={mockStats.platformBalance > 0 ? 'good' : 'warn'} />
        <Kpi label="ROI plateforme" value={`${mockStats.roi}%`} hint="Marge moyenne" tone="good" />
        <Kpi label="Retraits en attente" value={pending.items.length} hint={formatFCFA(pending.total)} tone={pending.items.length > 0 ? 'warn' : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="card">
          <h2>Retraits à valider <Link to="/retraits" style={{ fontSize: 13, color: 'var(--accent)' }}>Tout ›</Link></h2>
          {pending.items.length === 0 ? (
            <Empty>Aucun retrait en attente.</Empty>
          ) : (
            <div style={{ fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div className="small muted">Total en attente</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatFCFA(pending.total)}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div className="small muted">Retrait le plus ancien</div>
                <div style={{ fontWeight: 600 }}>
                  {oldest ? `${waitMin}min • ${oldest.player.fullName}` : '—'}
                </div>
              </div>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                <Link to="/retraits" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  Traiter maintenant
                </Link>
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Actions rapides</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <Link to="/utilisateurs" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                👤 Utilisateurs
              </button>
            </Link>
            <Link to="/kyc" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                ✓ KYC
              </button>
            </Link>
            <Link to="/promotions" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                🎁 Promotions
              </button>
            </Link>
            <Link to="/jeux" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                🎮 Jeux
              </button>
            </Link>
            <Link to="/rapports" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                📊 Rapports
              </button>
            </Link>
            <Link to="/audit" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn sm" style={{ width: '100%' }}>
                🔍 Audit
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Derniers retraits <Link to="/retraits" style={{ fontSize: 13, color: 'var(--accent)' }}>Tout ›</Link></h2>
        {recent.items.length === 0 ? (
          <Empty>Aucun retrait pour l'instant.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Date</th><th>Joueur</th><th>Vers</th><th className="num">Montant</th><th>Statut</th><th>Traité par</th></tr></thead>
              <tbody>
                {recent.items.map((t) => (
                  <tr key={t.id}>
                    <td className="small">{TIME.format(t.createdAt)}</td>
                    <td><b>{t.player.fullName}</b></td>
                    <td>{OPERATORS[t.operator]?.name ?? t.operator}</td>
                    <td className="num"><b>{formatAmount(t.amount)}</b></td>
                    <td><Badge tone={statusTone(t.status) === 'warn' ? 'warn' : statusTone(t.status)}>{TX_STATUS_LABEL[t.status]}</Badge></td>
                    <td className="small muted">{t.review?.byEmail ?? (t.status === 'pending_review' ? '—' : 'Automatique')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
