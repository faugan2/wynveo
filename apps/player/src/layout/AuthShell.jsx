import { Outlet } from 'react-router-dom';
import { DemoBanner } from './DemoBanner.jsx';

const main = {
  flex: 1, width: '100%', maxWidth: 440, margin: '0 auto',
  padding: '20px var(--gutter) 28px', display: 'flex', flexDirection: 'column', gap: 16,
};

/** Cadre des écrans d'accès (bienvenue, connexion, inscription). */
export function AuthShell() {
  return (
    <>
      <DemoBanner />
      <main style={main}><Outlet /></main>
    </>
  );
}
