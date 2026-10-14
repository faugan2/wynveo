/**
 * Session du joueur : compte connecté, profil et portefeuille, partagés
 * par toute l'application (Jeux et Sport utilisent le même solde).
 *
 * status :
 *  - 'loading'      : on ne sait pas encore
 *  - 'guest'        : personne n'est connecté
 *  - 'needsProfile' : connecté par SMS mais inscription non terminée
 *  - 'ready'        : profil et portefeuille disponibles
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService, profileService, walletService } from '../services/index.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(undefined);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => authService.onAuthChange(setUser), []);

  useEffect(() => {
    setProfile(undefined);
    if (!user) return undefined;
    return profileService.watchProfile(user.uid, setProfile, setError);
  }, [user]);

  const hasProfile = Boolean(profile);
  useEffect(() => {
    setWallet(null);
    if (!user || !hasProfile) return undefined;
    return walletService.watchWallet(user.uid, setWallet, setError);
  }, [user, hasProfile]);

  const value = useMemo(() => {
    let status = 'loading';
    if (user === null) status = 'guest';
    else if (user && profile === null) status = 'needsProfile';
    else if (user && profile && wallet) status = 'ready';
    return { status, user: user ?? null, profile: profile ?? null, wallet, error, signOut: authService.signOut };
  }, [user, profile, wallet, error]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession doit être utilisé dans <SessionProvider>.');
  return ctx;
}
