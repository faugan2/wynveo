import { useParams, useNavigate } from 'react-router-dom';
import { useUserDetail, useUserActions } from '../../hooks/useAdminUsers.js';
import './UserDetailPage.css';

const ACTION_LABELS = {
  deposit: 'Dépôt',
  withdrawal: 'Retrait',
};

const METHOD_LABELS = {
  mtn: 'MTN',
  moov: 'Moov',
  card: 'Carte',
  unknown: 'Inconnu',
};

export function UserDetailPage() {
  const navigate = useNavigate();
  const { uid } = useParams();
  const { user, transactions, loading, error, KYC_LABEL, STATUS_LABEL } = useUserDetail(uid);
  const { busy, error: actionError, suspend, resume, resetPassword } = useUserActions();

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="spinner">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-detail-page">
        <p className="error">Erreur: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-page">
        <p className="error">Utilisateur introuvable.</p>
      </div>
    );
  }

  const handleSuspend = async () => {
    const result = await suspend(uid);
    if (result) window.location.reload();
  };

  const handleResume = async () => {
    const result = await resume(uid);
    if (result) window.location.reload();
  };

  const handleResetPassword = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe ?')) {
      await resetPassword(uid);
    }
  };

  const balance = (user.balance || 0) + (user.bonusBalance || 0);
  const bilan = (user.totalDeposited || 0) - (user.totalWithdrawn || 0);

  return (
    <div className="user-detail-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/utilisateurs')}>
          ← Retour
        </button>
        <h1>{user.fullName}</h1>
      </div>

      {/* Bloc infos */}
      <div className="detail-grid">
        <div className="info-card">
          <h3>Informations</h3>
          <div className="info-row">
            <label>Téléphone</label>
            <span>{user.phone || 'N/A'}</span>
          </div>
          <div className="info-row">
            <label>Email</label>
            <span>{user.email || 'N/A'}</span>
          </div>
          <div className="info-row">
            <label>Inscription</label>
            <span>{user.createdAt?.toLocaleDateString('fr-FR') || 'N/A'}</span>
          </div>
          <div className="info-row">
            <label>Statut</label>
            <span className={`badge badge-${user.status}`}>
              {STATUS_LABEL[user.status] || user.status}
            </span>
          </div>
          <div className="info-row">
            <label>KYC</label>
            <span className={`badge badge-kyc-${user.kycStatus}`}>
              {KYC_LABEL[user.kycStatus] || user.kycStatus}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>Solde & Transactions</h3>
          <div className="info-row">
            <label>Solde</label>
            <span className="amount">{balance.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Total dépôts</label>
            <span>{(user.totalDeposited || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Total retraits</label>
            <span>{(user.totalWithdrawn || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Bilan</label>
            <span className={bilan >= 0 ? 'positive' : 'negative'}>
              {bilan >= 0 ? '+' : ''}{bilan.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>Activité de Jeu</h3>
          <div className="info-row">
            <label>Jeux misés</label>
            <span>{(user.gameStaked || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Jeux gagnés</label>
            <span>{(user.gameWon || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Ratio Jeux</label>
            <span>
              {user.gameStaked > 0 ? ((user.gameWon / user.gameStaked) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="info-row">
            <label>Sport misés</label>
            <span>{(user.sportStaked || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Sport gagnés</label>
            <span>{(user.sportWon || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="info-row">
            <label>Ratio Sport</label>
            <span>
              {user.sportStaked > 0 ? ((user.sportWon / user.sportStaked) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-card">
        <h3>Actions Admin</h3>
        {actionError && <p className="error-msg">{actionError}</p>}
        <div className="action-buttons">
          {user.status === 'active' ? (
            <button
              className="btn btn-danger"
              disabled={busy === 'suspend'}
              onClick={handleSuspend}
            >
              {busy === 'suspend' ? 'Suspension...' : 'Suspendre'}
            </button>
          ) : (
            <button
              className="btn btn-success"
              disabled={busy === 'resume'}
              onClick={handleResume}
            >
              {busy === 'resume' ? 'Réactivation...' : 'Réactiver'}
            </button>
          )}
          <button
            className="btn btn-warning"
            disabled={busy === 'reset-pw'}
            onClick={handleResetPassword}
          >
            {busy === 'reset-pw' ? 'Réinitialisation...' : 'Réinitialiser mot de passe'}
          </button>
        </div>
      </div>

      {/* Historique des transactions */}
      <div className="transactions-card">
        <h3>Historique des transactions ({transactions?.length || 0})</h3>
        {transactions && transactions.length > 0 ? (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Méthode</th>
                <th>Référence</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="tx-type">{ACTION_LABELS[tx.type] || tx.type}</td>
                  <td className="amount">{(tx.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td>
                    <span className={`badge badge-tx-${tx.status}`}>
                      {tx.status === 'success'
                        ? 'Succès'
                        : tx.status === 'pending'
                          ? 'En attente'
                          : 'Échouée'}
                    </span>
                  </td>
                  <td>{METHOD_LABELS[tx.method] || tx.method}</td>
                  <td className="mono">{tx.reference || '—'}</td>
                  <td>{tx.createdAt?.toLocaleString('fr-FR') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">Aucune transaction.</p>
        )}
      </div>
    </div>
  );
}
