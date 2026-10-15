import { useTransactions } from '../../hooks/useAdminUsers.js';
import { formatFCFA, formatPhone } from '@wynveo/core';
import { Btn, Empty, Kpi } from '../../ui/index.jsx';

function TransactionRow({ tx }) {
  const isSuspicious = tx.type === 'withdrawal' && tx.status !== 'success';

  return (
    <tr className={isSuspicious ? 'row-warn' : ''}>
      <td>
        <b>{tx.fullName}</b>
        <div className="small muted">{formatPhone(tx.phone)}</div>
      </td>
      <td className="small muted">{tx.createdAt.toLocaleDateString('fr-FR')}</td>
      <td>
        <span className={`badge ${tx.type === 'deposit' ? 'good' : 'neutral'}`}>
          {tx.type === 'deposit' ? 'Dépôt' : 'Retrait'}
        </span>
      </td>
      <td className={`num ${tx.type === 'deposit' ? 'positive' : 'negative'}`}>
        {tx.type === 'deposit' ? '+' : '-'}{formatFCFA(tx.amount)}
      </td>
      <td>
        <span className={`badge ${tx.status === 'success' ? 'good' : tx.status === 'pending' ? 'warn' : 'bad'}`}>
          {tx.status === 'success' ? 'Succès' : tx.status === 'pending' ? 'En attente' : 'Échouée'}
        </span>
      </td>
      <td className="small">{tx.method === 'mtn' ? 'MTN' : tx.method === 'moov' ? 'Moov' : tx.method === 'card' ? 'Carte' : 'Inconnue'}</td>
      <td className="mono small">{tx.reference || '—'}</td>
    </tr>
  );
}

/** Historique global des transactions avec filtres et recherche. */
export function TransactionsPage() {
  const { items, loading, error, search, setSearch, typeFilter, setTypeFilter, statusFilter, setStatusFilter, TX_TYPE_LABEL, TX_STATUS_LABEL } = useTransactions();

  const stats = {
    total: items.length,
    deposits: items.filter((t) => t.type === 'deposit').length,
    withdrawals: items.filter((t) => t.type === 'withdrawal').length,
    totalDeposited: items
      .filter((t) => t.type === 'deposit' && t.status === 'success')
      .reduce((s, t) => s + t.amount, 0),
    totalWithdrawn: items
      .filter((t) => t.type === 'withdrawal' && t.status === 'success')
      .reduce((s, t) => s + t.amount, 0),
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Historique des Transactions</h1>
      {error && <p className="notice bad" role="alert">{error}</p>}

      <div className="kpis">
        <Kpi label="Transactions" value={stats.total} />
        <Kpi label="Dépôts" value={stats.deposits} />
        <Kpi label="Retraits" value={stats.withdrawals} />
        <Kpi label="Total déposé" value={formatFCFA(stats.totalDeposited)} />
        <Kpi label="Total retiré" value={formatFCFA(stats.totalWithdrawn)} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          className="input"
          placeholder="Rechercher : numéro, nom ou référence"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 200px' }}
        />
        <select className="input" value={typeFilter ?? ''} onChange={(e) => setTypeFilter(e.target.value || null)}>
          <option value="">Tous les types</option>
          <option value="deposit">Dépôt</option>
          <option value="withdrawal">Retrait</option>
        </select>
        <select className="input" value={statusFilter ?? ''} onChange={(e) => setStatusFilter(e.target.value || null)}>
          <option value="">Tous les statuts</option>
          <option value="success">Succès</option>
          <option value="pending">En attente</option>
          <option value="failed">Échouée</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>Chargement…</p>
        ) : !items.length ? (
          <Empty>Aucune transaction.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th className="small">Date</th>
                  <th>Type</th>
                  <th className="num">Montant</th>
                  <th>Statut</th>
                  <th>Méthode</th>
                  <th>Référence</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
