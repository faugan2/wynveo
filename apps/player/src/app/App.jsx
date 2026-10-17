import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerSessionProvider } from '../hooks/PlayerSession.jsx';
import { PlayerShell } from '../layout/PlayerShell.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
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
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
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
