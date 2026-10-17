import { useState } from 'react';
import './WalletPage.css';

export function WalletPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Mock data
  const balance = 125000;
  const withdrawable = 123000;
  const bonus = 2000;

  const transactions = [
    { id: 1, type: 'deposit', amount: 50000, method: 'Orange Money', status: 'completed', date: '2024-10-15' },
    { id: 2, type: 'bet_loss', amount: -5000, method: 'Sports Bet', status: 'completed', date: '2024-10-14' },
    { id: 3, type: 'bet_win', amount: 15000, method: 'Sports Bet', status: 'completed', date: '2024-10-14' },
    { id: 4, type: 'game', amount: 2000, method: 'Lucky Spin', status: 'completed', date: '2024-10-13' },
    { id: 5, type: 'withdrawal', amount: -10000, method: 'Orange Money', status: 'pending', date: '2024-10-12' },
  ];

  return (
    <div className="wallet-page">
      {/* Header */}
      <div className="page-header">
        <h1>Portefeuille</h1>
        <p className="page-subtitle">Gérez votre argent et vos transactions</p>
      </div>

      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-item">
          <span className="balance-label">Solde Total</span>
          <span className="balance-amount">{balance.toLocaleString()} F</span>
        </div>
        <div className="balance-divider"></div>
        <div className="balance-item">
          <span className="balance-label">Retraitable</span>
          <span className="balance-amount teal">{withdrawable.toLocaleString()} F</span>
        </div>
        <div className="balance-divider"></div>
        <div className="balance-item">
          <span className="balance-label">Bonus</span>
          <span className="balance-amount green">{bonus.toLocaleString()} F</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="wallet-actions">
        <button
          className="action-btn orange"
          onClick={() => setShowDepositModal(true)}
        >
          <span className="icon">💰</span>
          <span>Dépôt</span>
        </button>
        <button
          className="action-btn purple"
          onClick={() => setShowWithdrawModal(true)}
        >
          <span className="icon">🏦</span>
          <span>Retrait</span>
        </button>
        <button className="action-btn teal">
          <span className="icon">📞</span>
          <span>Support</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Aperçu
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`tab-btn ${activeTab === 'methods' ? 'active' : ''}`}
          onClick={() => setActiveTab('methods')}
        >
          Méthodes
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-icon">📈</span>
              <span className="stat-label">Gains ce mois</span>
              <span className="stat-value green">+25,000 F</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">🎯</span>
              <span className="stat-label">Mises ce mois</span>
              <span className="stat-value">125,000 F</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">✅</span>
              <span className="stat-label">Taux de gain</span>
              <span className="stat-value">42%</span>
            </div>
          </div>

          <div className="info-box">
            <h3>💡 Conseil</h3>
            <p>Vous avez 2,000 F de bonus à utiliser. Les bonus expirent dans 7 jours.</p>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="tab-content">
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-info">
                  <div className={`tx-icon ${tx.type}`}>
                    {tx.type === 'deposit' && '📥'}
                    {tx.type === 'withdrawal' && '📤'}
                    {tx.type === 'bet_win' && '🎯'}
                    {tx.type === 'bet_loss' && '❌'}
                    {tx.type === 'game' && '🎰'}
                  </div>
                  <div>
                    <p className="tx-title">{tx.method}</p>
                    <p className="tx-date">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="tx-amount-status">
                  <p className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} F
                  </p>
                  <p className={`tx-status ${tx.status}`}>{tx.status === 'completed' ? '✓' : '⏳'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'methods' && (
        <div className="tab-content">
          <div className="methods-list">
            <div className="method-card">
              <div className="method-icon">📱</div>
              <div className="method-info">
                <h4>Orange Money</h4>
                <p>Numéro: +228 XXX XX 45</p>
              </div>
              <button className="method-btn">Utiliser</button>
            </div>
            <div className="method-card">
              <div className="method-icon">💳</div>
              <div className="method-info">
                <h4>Carte Bancaire</h4>
                <p>Visa ••••••••8956</p>
              </div>
              <button className="method-btn">Utiliser</button>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
            + Ajouter une méthode
          </button>
        </div>
      )}

      {/* Modals */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Effectuer un dépôt</h2>
            <div className="form-group">
              <label>Montant (FCFA)</label>
              <input type="number" placeholder="5000" min="1000" />
            </div>
            <div className="form-group">
              <label>Méthode</label>
              <select>
                <option>Orange Money</option>
                <option>Carte Bancaire</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDepositModal(false)}>
                Annuler
              </button>
              <button className="btn btn-primary">Continuer</button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Demander un retrait</h2>
            <div className="form-group">
              <label>Montant (FCFA)</label>
              <input type="number" placeholder={withdrawable} max={withdrawable} />
            </div>
            <div className="form-group">
              <label>Méthode</label>
              <select>
                <option>Orange Money</option>
                <option>Carte Bancaire</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)}>
                Annuler
              </button>
              <button className="btn btn-primary">Demander</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
