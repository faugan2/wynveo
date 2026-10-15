import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminSessionProvider, useAdminSession } from '../hooks/AdminSession.jsx';
import { AdminShell } from '../layout/AdminShell.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { UsersPage } from '../features/users/UsersPage.jsx';
import { UserDetailPage } from '../features/users/UserDetailPage.jsx';
import { TransactionsPage } from '../features/transactions/TransactionsPage.jsx';
import { KYCPage } from '../features/kyc/KYCPage.jsx';
import { ReportsPage } from '../features/reports/ReportsPage.jsx';
import { WithdrawalsPage } from '../features/withdrawals/WithdrawalsPage.jsx';
import { SportEventsPage } from '../features/sport/SportEventsPage.jsx';

function Gate() {
  const { status } = useAdminSession();
  if (status === 'loading') return <p style={{ padding: 40 }} className="muted">Chargement…</p>;
  if (status === 'guest') return <LoginPage />;
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="utilisateurs" element={<UsersPage />} />
        <Route path="utilisateurs/:uid" element={<UserDetailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="kyc" element={<KYCPage />} />
        <Route path="rapports" element={<ReportsPage />} />
        <Route path="retraits" element={<WithdrawalsPage />} />
        <Route path="matchs" element={<SportEventsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AdminSessionProvider>
      <BrowserRouter><Gate /></BrowserRouter>
    </AdminSessionProvider>
  );
}
