import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../hooks/SessionProvider.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import { AuthShell } from '../layout/AuthShell.jsx';
import { RequirePlayer, GuestOnly, RequireNewPlayer } from './guards.jsx';
import { ROUTES } from './routes.js';

import { WelcomePage } from '../features/auth/WelcomePage.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterPage } from '../features/auth/RegisterPage.jsx';
import { HomePage } from '../features/home/HomePage.jsx';
import { WalletPage } from '../features/wallet/WalletPage.jsx';
import { DepositPage } from '../features/wallet/DepositPage.jsx';
import { WithdrawPage } from '../features/wallet/WithdrawPage.jsx';
import { HistoryPage } from '../features/wallet/HistoryPage.jsx';
import { GamesPage } from '../features/games/GamesPage.jsx';
import { SportPage } from '../features/sport/SportPage.jsx';
import { BetsPage } from '../features/bets/BetsPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';

export function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route element={<AuthShell />}>
              <Route path={ROUTES.welcome} element={<WelcomePage />} />
              <Route path={ROUTES.login} element={<LoginPage />} />
            </Route>
          </Route>

          <Route element={<RequireNewPlayer />}>
            <Route element={<AuthShell />}>
              <Route path={ROUTES.register} element={<RegisterPage />} />
            </Route>
          </Route>

          <Route element={<RequirePlayer />}>
            <Route element={<AppShell />}>
              <Route path={ROUTES.home} element={<HomePage />} />
              <Route path={`${ROUTES.games}/*`} element={<GamesPage />} />
              <Route path={`${ROUTES.sport}/*`} element={<SportPage />} />
              <Route path={ROUTES.bets} element={<BetsPage />} />
              <Route path={ROUTES.wallet} element={<WalletPage />} />
              <Route path={ROUTES.deposit} element={<DepositPage />} />
              <Route path={ROUTES.withdraw} element={<WithdrawPage />} />
              <Route path={ROUTES.history} element={<HistoryPage />} />
              <Route path={ROUTES.profile} element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
