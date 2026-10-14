import { useState } from 'react';
import { OPERATORS, formatPhone, KYC_LABEL } from '@wynveo/core';
import { Amount, Badge, Btn, Empty } from '../../ui/index.jsx';
import { riskFlags } from '../../hooks/useWithdrawals.js';

const TIME = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const KYC_TONE = { none: 'bad', pending: 'warn', verified: 'good', rejected: 'bad' };

/** Tableau des retraits à valider. onReview(txId, 'approve'|'reject', reason) */
export function WithdrawalsTable({ items, canReview, busyId, onReview }) {
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  if (!items.length) return <Empty>Aucun retrait en attente. Tout est à jour.</Empty>;

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr><th>Demandé</th><th>Joueur</th><th>Vers</th><th className="num">Montant</th><th className="num">Déposé au total</th><th>KYC</th><th>Contrôles</th><th>Action</th></tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td className="small" style={{ whiteSpace: 'nowrap' }}>{TIME.format(t.createdAt)}<div className="muted">{t.reference}</div></td>
              <td><b>{t.player.fullName}</b><div className="small muted" style={{ whiteSpace: 'nowrap' }}>{formatPhone(t.player.phone)}</div></td>
              <td>{OPERATORS[t.operator]?.name ?? t.operator}<div className="small muted" style={{ whiteSpace: 'nowrap' }}>{formatPhone(t.msisdn)}</div></td>
              <td className="num"><Amount value={t.amount} /></td>
              <td className="num"><Amount value={t.player.totalDeposited} /></td>
              <td><Badge tone={KYC_TONE[t.player.kycStatus]}>{KYC_LABEL[t.player.kycStatus]}</Badge></td>
              <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{riskFlags(t).map((f) => <Badge key={f.label} tone={f.tone}>{f.label}</Badge>)}</div></td>
              <td style={{ minWidth: 220 }}>
                {!canReview ? <span className="small muted">Réservé à la finance</span>
                  : rejecting === t.id ? (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                      onSubmit={async (e) => { e.preventDefault(); if (await onReview(t.id, 'reject', reason)) { setRejecting(null); setReason(''); } }}>
                      <input className="input" style={{ height: 34 }} autoFocus placeholder="Motif envoyé au joueur" aria-label="Motif du refus"
                        value={reason} onChange={(e) => setReason(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="submit" className="btn sm no" disabled={busyId === t.id || !reason.trim()}>Confirmer le refus</button>
                        <Btn size="sm" onClick={() => { setRejecting(null); setReason(''); }}>Annuler</Btn>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="ok" size="sm" loading={busyId === t.id} onClick={() => onReview(t.id, 'approve')}>Approuver</Btn>
                      <Btn variant="no" size="sm" disabled={busyId === t.id} onClick={() => setRejecting(t.id)}>Rejeter</Btn>
                    </div>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
