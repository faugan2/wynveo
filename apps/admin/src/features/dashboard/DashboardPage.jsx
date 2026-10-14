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
  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Tableau de bord</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <Kpi label="Retraits à valider" value={pending.items.length} hint={formatFCFA(pending.total)} tone={pending.items.length ? 'warn' : undefined} />
        <Kpi label="Attente la plus longue" value={oldest ? `${waitMin} min` : '—'} hint={oldest ? oldest.player.fullName : 'Rien en attente'} />
      </div>
      <div className="card">
        <h2>Derniers retraits <Link to="/retraits" style={{ fontSize: 13, color: 'var(--accent)' }}>Retraits à valider ›</Link></h2>
        {recent.items.length === 0 ? <Empty>Aucun retrait pour l'instant.</Empty> : (
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
      <p className="small muted">Les indicateurs de dépôts, revenus et joueurs actifs arrivent avec le module Rapports.</p>
    </>
  );
}
