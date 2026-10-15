import { useState } from 'react';
import { Kpi } from '../../ui/index.jsx';
import { useAdmins, useAdminActions } from '../../hooks/useAdminManagement.js';
import './AdminsPage.css';

const ROLE_LABEL = { super: 'Super admin', finance: 'Finance', support: 'Support', trader: 'Trader sport' };
const ROLE_OPTIONS = ['super', 'finance', 'support', 'trader'];

export function AdminsPage() {
  const { items: admins, loading: loadingAdmins } = useAdmins();
  const { createAdmin, deleteAdmin, updateAdminRole, loading: actionLoading, error: actionError } = useAdminActions();

  const [showForm, setShowForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('support');
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [error, setError] = useState(null);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      setError('E-mail requis.');
      return;
    }
    try {
      await createAdmin(newAdminEmail, newAdminRole);
      setNewAdminEmail('');
      setNewAdminRole('support');
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet admin ?')) return;
    try {
      await deleteAdmin(adminId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateRole = async (adminId, newRole) => {
    try {
      await updateAdminRole(adminId, newRole);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loadingAdmins) return <div style={{ padding: 20 }}><p>Chargement…</p></div>;

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Administrateurs</h1>

      <div className="kpis">
        <Kpi label="Admins total" value={admins?.length ?? 0} />
        <Kpi label="Super admins" value={admins?.filter((a) => a.role === 'super').length ?? 0} />
        <Kpi label="Finance" value={admins?.filter((a) => a.role === 'finance').length ?? 0} />
      </div>

      {error && <div className="notice bad" style={{ marginBottom: 20 }}>{error}</div>}
      {actionError && <div className="notice bad" style={{ marginBottom: 20 }}>{actionError}</div>}

      <div className="card" style={{ padding: '1.5rem', marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Liste des admins</h2>
          <button type="button" className="btn sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter admin'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateAdmin} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>E-mail</label>
              <input
                type="email"
                placeholder="admin@wynveo.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Rôle</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn" disabled={actionLoading}>
              {actionLoading ? 'Création…' : 'Créer admin'}
            </button>
          </form>
        )}

        {!admins?.length ? (
          <p style={{ color: '#999' }}>Aucun admin.</p>
        ) : (
          <div className="table-wrap">
            <table className="data" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Rôle</th>
                  <th className="small">Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td><b>{admin.email}</b></td>
                    <td>
                      {editingId === admin.id ? (
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', borderRadius: 4 }}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge">{ROLE_LABEL[admin.role]}</span>
                      )}
                    </td>
                    <td className="small muted">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {editingId === admin.id ? (
                        <>
                          <button
                            type="button"
                            className="btn xs"
                            onClick={() => handleUpdateRole(admin.id, editingRole)}
                            disabled={actionLoading}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Valider
                          </button>
                          <button type="button" className="btn xs" onClick={() => setEditingId(null)}>
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn xs"
                            onClick={() => { setEditingId(admin.id); setEditingRole(admin.role); }}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Éditer
                          </button>
                          {admin.email !== 'admin@wynveo.com' && (
                            <button
                              type="button"
                              className="btn xs bad"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              disabled={actionLoading}
                            >
                              Supprimer
                            </button>
                          )}
                        </>
                      )}
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
