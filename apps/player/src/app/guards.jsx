/**
 * Aiguillage selon l'état de la session :
 *  - visiteur            -> écrans d'accès uniquement
 *  - inscription à finir -> écran "Inscription"
 *  - joueur prêt         -> application
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/SessionProvider.jsx';
import { ROUTES } from './routes.js';
import { SplashScreen } from './SplashScreen.jsx';

export function RequirePlayer() {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'guest') return <Navigate to={ROUTES.welcome} replace state={{ from: location.pathname }} />;
  if (status === 'needsProfile') return <Navigate to={ROUTES.register} replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'needsProfile') return <Navigate to={ROUTES.register} replace />;
  if (status === 'ready') return <Navigate to={location.state?.from ?? ROUTES.home} replace />;
  return <Outlet />;
}

/** Inscription : ouverte aux visiteurs et aux comptes dont le profil n'est pas encore créé. */
export function SignupGate() {
  const { status } = useSession();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'ready') return <Navigate to={ROUTES.home} replace />;
  return <Outlet />;
}
