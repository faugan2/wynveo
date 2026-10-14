import { Link } from 'react-router-dom';
import { maskPhone, PHONE_LABEL } from '@wynveo/core';
import { Card, EmptyState, ListRow, Pill, SectionTitle, Skeleton } from '../../ui/index.js';
import { useSession } from '../../hooks/SessionProvider.jsx';
import { useTransactions } from '../../hooks/useTransactions.js';
import { ROUTES } from '../../app/routes.js';
import { BalanceHero } from './components/BalanceHero.jsx';
import { BonusProgress } from './components/BonusProgress.jsx';
import { VerifyNumberCard } from './components/VerifyNumberCard.jsx';
import { TransactionRow } from './components/TransactionRow.jsx';

export function WalletPage() {
  const { wallet, profile } = useSession();
  const { items, loading } = useTransactions({ limit: 5 });
  return (
    <>
      <BalanceHero wallet={wallet} />
      {!profile.phoneVerified && <VerifyNumberCard phone={profile.phone} compact />}
      <BonusProgress wallet={wallet} />

      <SectionTitle>Numéro de retrait</SectionTitle>
      <Card flush>
        <ListRow
          title={maskPhone(profile.phone)}
          subtitle="Vos retraits sont envoyés uniquement sur le numéro de votre compte."
          right={<Pill tone={profile.phoneVerified ? 'good' : 'warn'}>{PHONE_LABEL[profile.phoneVerified]}</Pill>}
        />
      </Card>

      <SectionTitle action={<Link to={ROUTES.history}>Tout l'historique</Link>}>Dernières opérations</SectionTitle>
      <Card flush>
        {loading && <div style={{ padding: '12px 0', display: 'grid', gap: 10 }}><Skeleton height={38} /><Skeleton height={38} /></div>}
        {!loading && items.length === 0 && <EmptyState title="Aucune opération">Votre premier dépôt apparaîtra ici.</EmptyState>}
        {items.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </Card>
    </>
  );
}
