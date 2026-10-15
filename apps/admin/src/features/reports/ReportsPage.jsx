import { useEffect, useState, useMemo } from 'react';
import { formatFCFA, formatAmount } from '@wynveo/core';
import { Kpi, Empty } from '../../ui/index.jsx';
import { reportsService } from '../../services/index.js';
import './ReportsPage.css';

const ago = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const fmt = (d) => d.toISOString().split('T')[0];

export function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [topUsers, setTopUsers] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: fmt(ago(30)), end: fmt(ago(0)) });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sum, users, chart] = await Promise.all([
          reportsService.getFinancialSummary(),
          reportsService.getUserFinancialStats({ limit: 10, sort: 'top' }),
          reportsService.getReportByPeriod({ startDate: new Date(dateRange.start), endDate: new Date(dateRange.end), period: 'day' }),
        ]);
        setSummary(sum);
        setTopUsers(users);
        setChartData(chart);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [dateRange]);

  if (loading) return <div className="reports-page"><p className="muted">Chargement…</p></div>;
  if (error) return <div className="reports-page"><p className="notice bad">{error}</p></div>;

  return (
    <div className="reports-page">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Rapports & Analytics</h1>

      {/* KPIs Financiers */}
      <div className="kpis">
        <Kpi label="Joueurs actifs" value={summary?.activeUsers ?? 0} />
        <Kpi label="Total déposé" value={formatFCFA(summary?.totalDeposited ?? 0)} />
        <Kpi label="Total retiré" value={formatFCFA(summary?.totalWithdrawn ?? 0)} />
        <Kpi label="Solde" value={formatFCFA(summary?.balance ?? 0)} tone={summary?.balance > 0 ? 'good' : 'bad'} />
        <Kpi label="Mises" value={formatFCFA(summary?.totalStaked ?? 0)} />
        <Kpi label="Mises gagnées" value={formatFCFA(summary?.totalWon ?? 0)} />
        <Kpi label="ROI joueurs" value={`${summary?.playerROI ?? 0}%`} />
        <Kpi label="Marge platform" value={`${summary?.platformMargin ?? 0}%`} />
      </div>

      {/* Date Range Picker */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <label>De:</label>
        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
        <label>À:</label>
        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
      </div>

      {/* Charts Section */}
      {chartData && (
        <div className="card">
          <h2>Historique des transactions (30 jours)</h2>
          <div className="chart-container">
            <div className="chart-bars">
              {chartData.map((day, idx) => (
                <div key={idx} className="chart-day" title={day.date}>
                  <div
                    className="chart-bar deposits"
                    style={{ height: `${Math.max(5, (day.deposits / Math.max(...chartData.map((d) => d.deposits))) * 100)}%` }}
                  />
                  <div
                    className="chart-bar withdrawals"
                    style={{ height: `${Math.max(5, (day.withdrawals / Math.max(...chartData.map((d) => d.withdrawals))) * 100)}%` }}
                  />
                  <div className="chart-date">{day.date.substring(5)}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div><span className="legend-box deposits" /> Dépôts</div>
              <div><span className="legend-box withdrawals" /> Retraits</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Users */}
      {topUsers && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2>Top 10 utilisateurs par dépôts</h2>
          {!topUsers.length ? (
            <Empty>Aucun utilisateur.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th className="num">Total dépôts</th>
                    <th className="num">Total retraits</th>
                    <th className="num">Bilan</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user) => (
                    <tr key={user.uid}>
                      <td>
                        <b>{user.fullName}</b>
                        <div className="small muted">{user.phone}</div>
                      </td>
                      <td className="num">{formatFCFA(user.totalDeposited)}</td>
                      <td className="num">{formatFCFA(user.totalWithdrawn)}</td>
                      <td className="num" style={{ color: user.totalDeposited - user.totalWithdrawn >= 0 ? '#27ae60' : '#e74c3c' }}>
                        {formatFCFA(user.totalDeposited - user.totalWithdrawn)}
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'active' ? 'good' : 'bad'}`}>
                          {user.status === 'active' ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
