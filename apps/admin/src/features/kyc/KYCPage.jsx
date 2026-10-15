import { useState } from 'react';
import { useKYCRequests, useKYCActions } from '../../hooks/useAdminUsers.js';
import { formatFCFA, formatPhone } from '@wynveo/core';
import { Btn, Empty, Kpi } from '../../ui/index.jsx';
import './KYCPage.css';

function KYCRow({ request, onApprove, onReject, busy }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <>
      <tr className={`kyc-row kyc-${request.kycStatus}`}>
        <td>
          <b>{request.fullName}</b>
          <div className="small muted">{formatPhone(request.phone)}</div>
          <div className="small muted">{request.email}</div>
        </td>
        <td className="small muted">{request.kycSubmittedAt?.toLocaleDateString('fr-FR') || '—'}</td>
        <td>
          <span className={`badge ${request.kycStatus === 'pending' ? 'warn' : 'bad'}`}>
            {request.kycStatus === 'pending' ? 'En attente' : 'Rejetée'}
          </span>
        </td>
        <td className="num small">{formatFCFA(request.totalDeposited)}</td>
        <td>
          {request.kycStatus === 'pending' ? (
            <div className="action-group">
              <Btn
                size="sm"
                tone="good"
                disabled={busy === 'approve'}
                onClick={() => onApprove(request.uid)}
              >
                {busy === 'approve' ? 'Validation…' : 'Approuver'}
              </Btn>
              <Btn
                size="sm"
                tone="bad"
                disabled={busy === 'reject'}
                onClick={() => setShowRejectForm(!showRejectForm)}
              >
                Rejeter
              </Btn>
            </div>
          ) : (
            <div className="kyc-info">
              <div className="small">Raison: {request.kycRejectionReason}</div>
            </div>
          )}
        </td>
      </tr>
      {showRejectForm && (
        <tr className="kyc-reject-form">
          <td colSpan="5">
            <div className="reject-form">
              <label>Raison du rejet:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi la demande KYC est rejetée..."
                rows="3"
              />
              <div className="reject-actions">
                <Btn
                  tone="bad"
                  disabled={!rejectReason.trim() || busy === 'reject'}
                  onClick={async () => {
                    await onReject(request.uid, rejectReason);
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                >
                  {busy === 'reject' ? 'Rejet en cours…' : 'Confirmer le rejet'}
                </Btn>
                <Btn tone="muted" onClick={() => setShowRejectForm(false)}>
                  Annuler
                </Btn>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Gestion des demandes KYC en attente et rejetées. */
export function KYCPage() {
  const { items, loading, error, statusFilter, setStatusFilter, KYC_LABEL, STATUS_LABEL } = useKYCRequests();
  const { busy, error: actionError, approve, reject, clear: clearError } = useKYCActions();

  const stats = {
    pending: items.filter((r) => r.kycStatus === 'pending').length,
    rejected: items.filter((r) => r.kycStatus === 'rejected').length,
    total: items.length,
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vérifications KYC</h1>
      {error && <p className="notice bad" role="alert">{error}</p>}
      {actionError && (
        <p className="notice bad" role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {actionError}
          <button className="btn sm" onClick={clearError}>Fermer</button>
        </p>
      )}

      <div className="kpis">
        <Kpi label="En attente" value={stats.pending} tone={stats.pending > 0 ? 'warn' : undefined} />
        <Kpi label="Rejetées" value={stats.rejected} />
        <Kpi label="Total" value={stats.total} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select className="input" value={statusFilter ?? ''} onChange={(e) => setStatusFilter(e.target.value || null)}>
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="rejected">Rejetées</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>Chargement…</p>
        ) : !items.length ? (
          <Empty>Aucune demande KYC.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="data kyc-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th className="small">Soumise le</th>
                  <th>Statut</th>
                  <th className="num">Total déposé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((req) => (
                  <KYCRow key={req.uid} request={req} onApprove={approve} onReject={reject} busy={busy} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
