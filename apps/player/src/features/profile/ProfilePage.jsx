import { useState } from 'react';
import './ProfilePage.css';

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data
  const userData = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    phone: '+228 XX XX XX XX',
    country: 'Togo',
    dateOfBirth: '1990-05-15',
    accountCreated: '2024-08-10',
    totalBets: 45000,
    totalWins: 32500,
    winRate: '42%',
  };

  return (
    <div className="profile-page">
      {/* Header with Avatar */}
      <div className="profile-header">
        <div className="avatar">👤</div>
        <div>
          <h1>{userData.firstName} {userData.lastName}</h1>
          <p className="member-since">Membre depuis {new Date(userData.accountCreated).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          👤 Compte
        </button>
        <button
          className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('verification')}
        >
          ✓ Vérification
        </button>
        <button
          className={`tab-btn ${activeTab === 'limits' ? 'active' : ''}`}
          onClick={() => setActiveTab('limits')}
        >
          ⛔ Limites
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Paramètres
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && (
        <div className="tab-content">
          <div className="section">
            <div className="section-header">
              <h2>Informations Personnelles</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            {!isEditing ? (
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Prénom</span>
                  <span className="value">{userData.firstName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Nom</span>
                  <span className="value">{userData.lastName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email</span>
                  <span className="value">{userData.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Téléphone</span>
                  <span className="value">{userData.phone}</span>
                </div>
                <div className="info-item">
                  <span className="label">Pays</span>
                  <span className="value">{userData.country}</span>
                </div>
                <div className="info-item">
                  <span className="label">Date de Naissance</span>
                  <span className="value">{new Date(userData.dateOfBirth).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ) : (
              <form className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom</label>
                    <input type="text" defaultValue={userData.firstName} />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" defaultValue={userData.lastName} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" defaultValue={userData.email} />
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(false)}>
                  Enregistrer les modifications
                </button>
              </form>
            )}
          </div>

          {/* Stats */}
          <div className="section">
            <h2>Statistiques de Jeu</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Mises</span>
                <span className="stat-value">{userData.totalBets.toLocaleString()} F</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Gains</span>
                <span className="stat-value green">{userData.totalWins.toLocaleString()} F</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Taux de Gain</span>
                <span className="stat-value">{userData.winRate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="tab-content">
          <div className="section">
            <h2>Vérification d'Identité</h2>

            <div className="verification-item">
              <div className="verification-header">
                <span className="doc-type">📋 Pièce d'Identité</span>
                <span className="status pending">En attente</span>
              </div>
              <p className="doc-info">Passeport, Permis de conduire ou Carte d'Identité</p>
              <button className="btn btn-secondary">Télécharger</button>
            </div>

            <div className="verification-item">
              <div className="verification-header">
                <span className="doc-type">📄 Justificatif de Domicile</span>
                <span className="status pending">En attente</span>
              </div>
              <p className="doc-info">Facture électricité/eau ou relevé bancaire (moins de 3 mois)</p>
              <button className="btn btn-secondary">Télécharger</button>
            </div>

            <div className="verification-item">
              <div className="verification-header">
                <span className="doc-type">📸 Selfie de Vérification</span>
                <span className="status pending">En attente</span>
              </div>
              <p className="doc-info">Vous tenant votre document d'identité</p>
              <button className="btn btn-secondary">Prendre une photo</button>
            </div>

            <div className="info-box">
              <h3>ℹ️ Pourquoi la vérification?</h3>
              <p>La vérification d'identité est requise pour retirer des gains et vous protège contre la fraude.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'limits' && (
        <div className="tab-content">
          <div className="section">
            <h2>Limites de Jeu Responsable</h2>

            <div className="limit-item">
              <div className="limit-header">
                <span>Limite de Dépôt Quotidienne</span>
                <button className="btn btn-secondary btn-sm">Modifier</button>
              </div>
              <div className="limit-value">100 000 FCFA / jour</div>
            </div>

            <div className="limit-item">
              <div className="limit-header">
                <span>Limite de Mise Quotidienne</span>
                <button className="btn btn-secondary btn-sm">Modifier</button>
              </div>
              <div className="limit-value">500 000 FCFA / jour</div>
            </div>

            <div className="limit-item">
              <div className="limit-header">
                <span>Pause de Jeu</span>
                <button className="btn btn-secondary btn-sm">Activer</button>
              </div>
              <div className="limit-value">Aucune pause active</div>
            </div>

            <div className="info-box warning">
              <h3>⚠️ Aide pour le Jeu Responsable</h3>
              <p>Si vous avez du mal à contrôler votre jeu, contactez-nous ou visitez <strong>FICAD.org</strong> pour des ressources d'aide.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="section">
            <h2>Préférences</h2>

            <div className="setting-item">
              <div className="setting-header">
                <span>Notifications Email</span>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-switch"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-header">
                <span>Notifications SMS</span>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-switch"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-header">
                <span>Authentification à Deux Facteurs</span>
              </div>
              <label className="toggle">
                <input type="checkbox" />
                <span className="toggle-switch"></span>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="section danger">
            <h2>Zone Dangereuse</h2>
            <button className="btn btn-danger">
              🚪 Déconnecter de tous les appareils
            </button>
            <button className="btn btn-danger">
              🔒 Changer le mot de passe
            </button>
            <button className="btn btn-danger">
              ❌ Supprimer le compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
