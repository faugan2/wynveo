import { useState } from 'react';
import { Kpi } from '../../ui/index.jsx';
import { useAuditLogs } from '../../hooks/useAudit.js';
import './AuditPage.css';

const ACTION_LABEL = {
  user_suspended: 'Utilisateur suspendu',
  user_resumed: 'Utilisateur réactivé',
  withdrawal_approved: 'Retrait approuvé',
  withdrawal_rejected: 'Retrait rejeté',
  kyc_approved: 'KYC approuvée',
  kyc_rejected: 'KYC rejetée',
  password_reset: 'Mot de passe réinitialisé',
  promo_code_created: 'Code promo créé',
  promo_code_updated: 'Code promo modifié',
  admin_created: 'Admin créé',
  admin_deleted: 'Admin supprimé',
  admin_role_changed: 'Rôle admin modifié',
};

export function AuditPage() {
  const [adminFilter, setAdminFilter] = useState(null);
  const [actionFilter, setActionFilter] = useState(null);

  const { logs, stats, loading, error } = useAuditLogs({ adminFilter, actionFilter });

  if (loading) return <div style={{ padding: 20 }}><p>Chargement…</p></div>;
  if (error) return <div style={{ padding: 20 }}><p className="notice bad">{error}</p></div>;

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Journaux d'audit</h1>

      <div className="kpis">
        <Kpi label="Logs total" value={stats?.totalLogs ?? 0} />
        <Kpi label="Admins actifs" value={stats?.byAdmin?.length ?? 0} />
        <Kpi label="Types d'actions" value={stats?.byAction?.length ?? 0} />
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: 20 }}>
        <h2 style={{ marginBottom: '1rem' }}>Top actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
          {stats?.topActions?.map((item) => (
            <div key={item.action} style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <div className="small muted">{ACTION_LABEL[item.action] || item.action}</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: 20 }}>
        <h2 style={{ marginBottom: '1rem' }}>Logs</h2>

        <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Admin</label>
            <select
              value={adminFilter ?? ''}
              onChange={(e) => setAdminFilter(e.target.value || null)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
            >
              <option value="">Tous</option>
              {stats?.byAdmin?.map((item) => (
                <option key={item.email} value={item.email}>{item.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Action</label>
            <select
              value={actionFilter ?? ''}
              onChange={(e) => setActionFilter(e.target.value || null)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
            >
              <option value="">Tous</option>
              {stats?.byAction?.map((item) => (
                <option key={item.action} value={item.action}>{ACTION_LABEL[item.action] || item.action}</option>
              ))}
            </select>
          </div>
        </div>

        {!logs?.length ? (
          <p style={{ color: '#999' }}>Aucun log.</p>
        ) : (
          <div className="table-wrap">
            <table className="data" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th className="small">Date/Heure</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="small muted">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="small"><b>{log.adminEmail}</b></td>
                    <td className="small">{ACTION_LABEL[log.action] || log.action}</td>
                    <td style={{ fontSize: '0.8rem', color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}
                    </td>
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
