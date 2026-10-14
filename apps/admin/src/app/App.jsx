import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminSessionProvider, useAdminSession } from '../hooks/AdminSession.jsx';
import { AdminShell } from '../layout/AdminShell.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { WithdrawalsPage } from '../features/withdrawals/WithdrawalsPage.jsx';

function Gate() {
  const { status } = useAdminSession();
  if (status === 'loading') return <p style={{ padding: 40 }} className="muted">Chargement…</p>;
  if (status === 'guest') return <LoginPage />;
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="retraits" element={<WithdrawalsPage />} />
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
