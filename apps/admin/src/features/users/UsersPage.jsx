import { useAdminSession, can } from '../../hooks/AdminSession.jsx';
import { useAdminUsers } from '../../hooks/useAdminUsers.js';
import { formatFCFA, formatPhone } from '@wynveo/core';
import { Btn, Empty, Kpi } from '../../ui/index.jsx';

const KYC_TONE = { none: 'bad', pending: 'warn', verified: 'good', rejected: 'bad' };

function UserRow({ user, onSelect }) {
  const net = user.totalDeposited - user.totalWithdrawn;
  const gameRatio = user.gameStaked > 0 ? (user.gameWon / user.gameStaked).toFixed(2) : '–';
  const sportRatio = user.sportStaked > 0 ? (user.sportWon / user.sportStaked).toFixed(2) : '–';
  return (
    <tr>
      <td><b>{user.fullName}</b><div className="small muted">{formatPhone(user.phone)}</div></td>
      <td className="small muted">{user.createdAt.toLocaleDateString('fr-FR')}</td>
      <td><span className={`badge ${user.status === 'active' ? 'good' : 'bad'}`}>{user.status === 'active' ? 'Actif' : 'Suspendu'}</span></td>
      <td><span className={`badge ${KYC_TONE[user.kycStatus]}`}>{user.kycStatus}</span></td>
      <td className="num">{formatFCFA(user.balance)}</td>
      <td className="num">{formatFCFA(user.totalDeposited)}</td>
      <td className="num">{formatFCFA(net)} <span className={net >= 0 ? 'muted' : 'error'}>{net >= 0 ? '↑' : '↓'}</span></td>
      <td className="num small">{gameRatio}x</td>
      <td className="num small">{sportRatio}x</td>
      <td><Btn size="sm" onClick={() => onSelect(user.uid)}>Voir</Btn></td>
    </tr>
  );
}

/** Liste des joueurs avec filtres, recherche et actions. */
export function UsersPage() {
  const { admin } = useAdminSession();
  const { items, loading, error, search, setSearch, statusFilter, setStatusFilter, kycFilter, setKycFilter, KYC_LABEL, STATUS_LABEL } = useAdminUsers();
  const allowed = can.manageSport(admin.role) || admin.role === 'support';

  if (!allowed) return <p className="notice bad">Lecture seule : seul Super admin et Support peuvent accéder.</p>;

  const stats = {
    total: items.length,
    active: items.filter((u) => u.status === 'active').length,
    suspended: items.filter((u) => u.status === 'suspended').length,
    kycVerified: items.filter((u) => u.kycStatus === 'verified').length,
    totalDeposited: items.reduce((s, u) => s + u.totalDeposited, 0),
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Utilisateurs</h1>
      {error && <p className="notice bad" role="alert">{error}</p>}

      <div className="kpis">
        <Kpi label="Joueurs" value={stats.total} />
        <Kpi label="Actifs" value={stats.active} tone={stats.suspended ? 'warn' : undefined} />
        <Kpi label="Suspendus" value={stats.suspended} />
        <Kpi label="KYC vérifiés" value={stats.kycVerified} />
        <Kpi label="Total déposé" value={formatFCFA(stats.totalDeposited)} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          className="input"
          placeholder="Rechercher : numéro ou nom"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 200px' }}
        />
        <select className="input" value={statusFilter ?? ''} onChange={(e) => setStatusFilter(e.target.value || null)}>
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
        </select>
        <select className="input" value={kycFilter ?? ''} onChange={(e) => setKycFilter(e.target.value || null)}>
          <option value="">Tous les KYC</option>
          {Object.entries(KYC_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <p className="muted" style={{ padding: 20 }}>Chargement…</p> : !items.length ? <Empty>Aucun joueur.</Empty> : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Joueur</th><th className="small">Inscription</th><th>Statut</th><th>KYC</th><th className="num">Solde</th><th className="num">Dépôts</th><th className="num">Bilan</th><th>Jeux</th><th>Sport</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map((u) => <UserRow key={u.uid} user={u} onSelect={(uid) => window.location.hash = `/users/${uid}`} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
