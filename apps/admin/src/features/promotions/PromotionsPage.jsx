import { useEffect, useState } from 'react';
import { formatFCFA } from '@wynveo/core';
import { Kpi } from '../../ui/index.jsx';
import { promotionService } from '../../services/index.js';
import './PromotionsPage.css';

export function PromotionsPage() {
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    maxUses: '',
    minDeposit: '',
    expiresAt: '',
  });

  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadStats = async () => {
    try {
      const result = await promotionService.getPromoStats();
      setStats(result);
      setCodes(result.codes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.code.trim()) {
      setFormError('Code requis.');
      return;
    }
    if (!formData.value) {
      setFormError('Valeur requise.');
      return;
    }

    setFormLoading(true);
    try {
      await promotionService.createPromoCode({
        code: formData.code,
        type: formData.type,
        value: parseInt(formData.value),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        minDeposit: formData.minDeposit ? parseInt(formData.minDeposit) : 0,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
      });

      setFormData({ code: '', type: 'percent', value: '', maxUses: '', minDeposit: '', expiresAt: '' });
      setShowForm(false);
      await loadStats();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}><p>Chargement…</p></div>;
  if (error) return <div style={{ padding: 20 }}><p className="notice bad">{error}</p></div>;

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Promotions & Bonus</h1>

      <div className="kpis">
        <Kpi label="Codes totaux" value={stats?.totalCodes ?? 0} />
        <Kpi label="Codes actifs" value={stats?.activeCodes ?? 0} />
        <Kpi label="Utilisations totales" value={stats?.totalUsed ?? 0} />
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Codes promo</h2>
          <button type="button" className="btn sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Créer code'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreatePromo} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            {formError && <div className="notice bad" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Code</label>
                <input
                  type="text"
                  placeholder="SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Valeur {formData.type === 'percent' ? '(%)' : '(FCFA)'}
                </label>
                <input
                  type="number"
                  placeholder={formData.type === 'percent' ? '20' : '5000'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Max utilisations</label>
                <input
                  type="number"
                  placeholder="Sans limite"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Dépôt minimum</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.minDeposit}
                  onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Expire le</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn" disabled={formLoading}>
              {formLoading ? 'Création…' : 'Créer code'}
            </button>
          </form>
        )}

        {!codes?.length ? (
          <p style={{ color: '#999' }}>Aucun code.</p>
        ) : (
          <div className="table-wrap">
            <table className="data" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th className="num">Valeur</th>
                  <th className="num">Utilisé</th>
                  <th className="num">Restant</th>
                  <th>Min dépôt</th>
                  <th>Expire</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.code} style={{ opacity: code.active ? 1 : 0.5 }}>
                    <td><b>{code.code}</b></td>
                    <td>{code.type === 'percent' ? '%' : 'Fixe'}</td>
                    <td className="num">
                      {code.type === 'percent' ? `${code.value}%` : formatFCFA(code.value)}
                    </td>
                    <td className="num">{code.usedCount}</td>
                    <td className="num">
                      {code.maxUses ? code.maxUses - code.usedCount : '∞'}
                    </td>
                    <td className="num">
                      {code.minDeposit ? formatFCFA(code.minDeposit) : '—'}
                    </td>
                    <td className="small">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${code.active ? 'good' : 'neutral'}`}>
                        {code.active ? 'Actif' : 'Inactif'}
                      </span>
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
