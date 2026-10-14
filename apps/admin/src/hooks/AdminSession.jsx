import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { adminAuthService } from '../services/index.js';

const Ctx = createContext(null);

/** Session admin : status 'loading' | 'guest' | 'ready', avec le rôle de l'admin. */
export function AdminSessionProvider({ children }) {
  const [admin, setAdmin] = useState(undefined);
  const [denied, setDenied] = useState(null);
  useEffect(() => adminAuthService.onAuthChange((a, err) => { setAdmin(a); if (err) setDenied(err.message); }), []);
  const value = useMemo(() => ({
    status: admin === undefined ? 'loading' : admin ? 'ready' : 'guest',
    admin: admin ?? null,
    denied,
    signOut: adminAuthService.signOut,
  }), [admin, denied]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminSession doit être utilisé dans <AdminSessionProvider>.');
  return ctx;
}

/** Droits par rôle, alignés sur les Cloud Functions et les règles Firestore. */
export const can = {
  reviewWithdrawals: (role) => ['super', 'finance'].includes(role),
  manageSport: (role) => ['super', 'trader'].includes(role),
};
