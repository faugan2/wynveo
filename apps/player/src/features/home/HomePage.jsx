import { Link } from 'react-router-dom';
import { formatFCFA, WELCOME_BONUS } from '@wynveo/core';
import { HubCard, Notice, SectionTitle } from '../../ui/index.js';
import { useSession } from '../../hooks/SessionProvider.jsx';
import { ROUTES } from '../../app/routes.js';
import { BalanceHero } from '../wallet/components/BalanceHero.jsx';
import { BonusProgress } from '../wallet/components/BonusProgress.jsx';
import { VerifyNumberCard } from '../wallet/components/VerifyNumberCard.jsx';

const greeting = () => (new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir');

/** Accueil : solde commun et choix entre les deux applications. */
export function HomePage() {
  const { profile, wallet } = useSession();
  const firstName = profile.fullName.split(' ')[0];
  return (
    <>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-dim)', letterSpacing: '0.06em' }}>{greeting().toUpperCase()}</div>
        <h1 style={{ fontSize: '1.25rem' }}>{firstName}</h1>
      </div>

      <BalanceHero wallet={wallet} compact />

      {!profile.phoneVerified && <VerifyNumberCard phone={profile.phone} />}
      {profile.phoneVerified && !wallet.welcomeBonusGranted && (
        <Notice tone="warn" icon="gift">
          <b style={{ color: '#fff' }}>Bonus de bienvenue :</b> {WELCOME_BONUS.rate * 100} % de votre prochain dépôt depuis votre numéro, jusqu'à {formatFCFA(WELCOME_BONUS.cap)}.{' '}
          <Link to={ROUTES.deposit}>Déposer maintenant</Link>
        </Notice>
      )}

      <SectionTitle>Que voulez-vous faire ?</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <HubCard as={Link} to={ROUTES.games} tone="games" art="🎰" title="Jeux"
          text="Lucky Spin · Mystery Box · Lucky Number · Jackpot" />
        <HubCard as={Link} to={ROUTES.sport} tone="sport" art="⚽" title="Sport"
          text="Football, basket, tennis · en direct et à venir" />
      </div>

      <BonusProgress wallet={wallet} />
    </>
  );
}
