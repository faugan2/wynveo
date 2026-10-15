import { useEffect, useState } from 'react';
import { formatFCFA } from '@wynveo/core';
import { Kpi } from '../../ui/index.jsx';
import { promotionService } from '../../services/index.js';

export function PromotionsPage() {
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await promotionService.getPromoStats();
        setStats(result);
        setCodes(result.codes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <h2 style={{ marginBottom: '1rem' }}>Codes promo actifs</h2>
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
