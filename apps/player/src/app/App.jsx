import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerSessionProvider } from '../hooks/PlayerSession.jsx';
import { PlayerShell } from '../layout/PlayerShell.jsx';

// Auth Pages
import { WelcomePage } from '../features/auth/WelcomePage.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterPage } from '../features/auth/RegisterPage.jsx';
import { SMSVerificationPage } from '../features/auth/SMSVerificationPage.jsx';

// Player Pages
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { WalletPage } from '../features/wallet/WalletPage.jsx';
import { SportsPage } from '../features/sports/SportsPage.jsx';
import { GamesPage } from '../features/games/GamesPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/portefeuille" element={<WalletPage />} />
      <Route path="/sports" element={<SportsPage />} />
      <Route path="/jeux" element={<GamesPage />} />
      <Route path="/profil" element={<ProfilePage />} />
    </Routes>
  );
}

export function App() {
  return (
    <PlayerSessionProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/verification-sms" element={<SMSVerificationPage />} />

          {/* Protected Player Routes */}
          <Route
            path="/accueil"
            element={
              <PlayerShell>
                <AppContent />
              </PlayerShell>
            }
          />
        </Routes>
      </Router>
    </PlayerSessionProvider>
  );
}
