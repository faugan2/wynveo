import { useState } from 'react';
import { formatFCFA } from '@wynveo/core';
import { useWallet } from '../../hooks/useWallet.js';

const METHODS = ['TMONEY', 'FLOOZ', 'BANK'];

export function WalletPage() {
  const { balance, transactions, loading, error, createDeposit, requestWithdrawal } = useWallet();
  const [tab, setTab] = useState('balance');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('TMONEY');
  const [submitting, setSubmitting] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDeposit(parseInt(amount), method);
      setAmount('');
      setTab('history');
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestWithdrawal(parseInt(amount), method);
      setAmount('');
      setTab('history');
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>💰 Portefeuille</h1>

      {error && <div className="notice bad" style={{ marginBottom: 20 }}>{error}</div>}

      {balance && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <div className="small muted">Solde</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#27ae60' }}>{formatFCFA(balance.balance)}</div>
          </div>
          <div style={{ padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <div className="small muted">Dépôts</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatFCFA(balance.totalDeposited)}</div>
          </div>
          <div style={{ padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <div className="small muted">Retraits</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatFCFA(balance.totalWithdrawn)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #eee' }}>
        <button
          type="button"
          className={`btn sm ${tab === 'balance' ? 'active' : ''}`}
          onClick={() => setTab('balance')}
          style={{ flex: 1, borderBottomWidth: tab === 'balance' ? 2 : 0, borderBottomColor: 'var(--accent)' }}
        >
          Solde
        </button>
        <button
          type="button"
          className={`btn sm ${tab === 'deposit' ? 'active' : ''}`}
          onClick={() => setTab('deposit')}
          style={{ flex: 1, borderBottomWidth: tab === 'deposit' ? 2 : 0, borderBottomColor: 'var(--accent)' }}
        >
          Dépôt
        </button>
        <button
          type="button"
          className={`btn sm ${tab === 'withdrawal' ? 'active' : ''}`}
          onClick={() => setTab('withdrawal')}
          style={{ flex: 1, borderBottomWidth: tab === 'withdrawal' ? 2 : 0, borderBottomColor: 'var(--accent)' }}
        >
          Retrait
        </button>
        <button
          type="button"
          className={`btn sm ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
          style={{ flex: 1, borderBottomWidth: tab === 'history' ? 2 : 0, borderBottomColor: 'var(--accent)' }}
        >
          Historique
        </button>
      </div>

      {tab === 'deposit' && (
        <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 400 }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 5 }}>Montant</label>
            <input
              type="number"
              placeholder="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              required
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 5 }}>Méthode</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Traitement…' : 'Déposer'}</button>
        </form>
      )}

      {tab === 'withdrawal' && (
        <form onSubmit={handleWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 400 }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 5 }}>Montant</label>
            <input
              type="number"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              required
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 5 }}>Méthode</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Traitement…' : 'Demander retrait'}</button>
        </form>
      )}

      {tab === 'history' && transactions && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 15 }}>Transactions</h3>
          {transactions.length === 0 ? (
            <p className="muted">Aucune transaction</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Type</th>
                  <th style={{ textAlign: 'right', padding: 10 }}>Montant</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Méthode</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{tx.date.toLocaleString('fr-FR')}</td>
                    <td style={{ padding: 10 }}>{tx.type === 'deposit' ? '+ Dépôt' : '- Retrait'}</td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>{formatFCFA(tx.amount)}</td>
                    <td style={{ padding: 10 }}>{tx.method}</td>
                    <td style={{ padding: 10 }}><span className="badge" style={{ color: tx.status === 'success' ? 'green' : 'orange' }}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
