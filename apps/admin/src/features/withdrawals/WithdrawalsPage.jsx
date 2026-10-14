import { formatFCFA, WITHDRAWAL_LIMITS } from '@wynveo/core';
import { useAdminSession, can } from '../../hooks/AdminSession.jsx';
import { usePendingWithdrawals, useReviewWithdrawal } from '../../hooks/useWithdrawals.js';
import { WithdrawalsTable } from './WithdrawalsTable.jsx';

export function WithdrawalsPage() {
  const { admin } = useAdminSession();
  const pending = usePendingWithdrawals();
  const action = useReviewWithdrawal();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Retraits à valider</h1>
        <span className="muted">{pending.items.length} demande(s) · {formatFCFA(pending.total)}</span>
      </div>
      <p className="notice">
        Validation automatique sous {formatFCFA(WITHDRAWAL_LIMITS.autoApproveMax)} pour les joueurs vérifiés.
        Un refus rembourse immédiatement le joueur. Chaque décision est enregistrée dans le journal d'audit.
      </p>
      {action.error && <p className="notice bad" role="alert">{action.error}</p>}
      {pending.error && <p className="notice bad" role="alert">{pending.error.message}</p>}
      <div className="card" style={{ padding: 0 }}>
        {pending.loading ? <p className="muted" style={{ padding: 20 }}>Chargement…</p> : (
          <WithdrawalsTable
            items={pending.items}
            canReview={can.reviewWithdrawals(admin.role)}
            busyId={action.busyId}
            onReview={action.review}
          />
        )}
      </div>
    </>
  );
}
