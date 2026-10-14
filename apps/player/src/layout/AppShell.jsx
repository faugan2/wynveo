import { Link, NavLink, Outlet, useMatch } from 'react-router-dom';
import { formatAmount, displayBalance } from '@wynveo/core';
import { Brand, Icon } from '../ui/index.js';
import { useSession } from '../hooks/SessionProvider.jsx';
import { DemoBanner } from './DemoBanner.jsx';
import { ROUTES } from '../app/routes.js';
import s from './AppShell.module.css';

const TABS = [
  { to: ROUTES.home, icon: 'home', label: 'Accueil', end: true },
  { to: ROUTES.games, icon: 'games', label: 'Jeux' },
  { to: ROUTES.sport, icon: 'sport', label: 'Sport' },
  { to: ROUTES.bets, icon: 'bets', label: 'Mes Paris' },
  { to: ROUTES.wallet, icon: 'wallet', label: 'Portefeuille', short: 'Portef.' },
  { to: ROUTES.profile, icon: 'user', label: 'Profil' },
];

/** Cadre des écrans connectés : barre du haut (logo, solde, onglets) + contenu. */
export function AppShell() {
  const { wallet, heldBalance } = useSession();
  const onGames = useMatch(`${ROUTES.games}/*`);
  const onSport = useMatch(`${ROUTES.sport}/*`);
  const wide = Boolean(onGames || onSport);
  return (
    <>
      <DemoBanner />
      <header className={s.top}>
        <div className={s.topIn}>
          <Link to={ROUTES.home} className={s.brandLink} aria-label="Wynveo, accueil"><Brand /></Link>
          <nav className={s.tabs} aria-label="Navigation principale">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `${s.tab} ${isActive ? s.active : ''}`}>
                <Icon name={t.icon} size={21} />
                <span>{t.short ? <><span className={s.full}>{t.label}</span><span className={s.short}>{t.short}</span></> : t.label}</span>
              </NavLink>
            ))}
          </nav>
          <Link to={ROUTES.wallet} className={s.wallet} aria-label="Mon solde">
            Solde : <b>{formatAmount(heldBalance ?? displayBalance(wallet))}</b> FCFA
          </Link>
        </div>
      </header>
      <main className={`${s.main} ${wide ? s.wide : ''}`}>
        <Outlet />
      </main>
    </>
  );
}
