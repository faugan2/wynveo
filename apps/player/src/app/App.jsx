import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PlayerSessionProvider, usePlayerSession } from '../hooks/PlayerSession.jsx';
import { PlayerShell } from '../layout/PlayerShell.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { WalletPage } from '../features/wallet/WalletPage.jsx';
import { SportsPage } from '../features/sports/SportsPage.jsx';
import { GamesPage } from '../features/games/GamesPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';

function Gate() {
  const { status } = usePlayerSession();
  if (status === 'loading') return <p style={{ padding: 40 }} className="muted">Chargement…</p>;
  if (status === 'guest') return <LoginPage />;
  return (
    <Routes>
      <Route element={<PlayerShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="portefeuille" element={<WalletPage />} />
        <Route path="sports" element={<SportsPage />} />
        <Route path="jeux" element={<GamesPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <PlayerSessionProvider>
      <BrowserRouter><Gate /></BrowserRouter>
    </PlayerSessionProvider>
  );
}
