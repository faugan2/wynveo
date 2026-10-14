import { Link } from 'react-router-dom';
import { formatPhone, initials, KYC_LABEL, PHONE_LABEL } from '@wynveo/core';
import { Avatar, Button, Card, Icon, ListRow, Pill } from '../../ui/index.js';
import { useSession } from '../../hooks/SessionProvider.jsx';
import { useCopy } from '../../hooks/useCopy.js';
import { ROUTES } from '../../app/routes.js';

const KYC_TONE = { none: 'warn', pending: 'info', verified: 'good', rejected: 'bad' };

export function ProfilePage() {
  const { profile, signOut } = useSession();
  const copy = useCopy();
  const soon = <Pill>Bientôt</Pill>;
  return (
    <>
      <Card style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <Avatar initials={initials(profile.fullName)} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.fullName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--fg-dim)', marginBottom: 4 }}>{formatPhone(profile.phone)}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill tone={profile.phoneVerified ? 'good' : 'warn'}>{PHONE_LABEL[profile.phoneVerified]}</Pill>
            <Pill tone={KYC_TONE[profile.kycStatus]}>{KYC_LABEL[profile.kycStatus]}</Pill>
          </div>
        </div>
      </Card>

      <Card flush>
        <ListRow
          as="button" type="button" onClick={() => copy.copy(profile.referralCode)}
          icon={<Icon name="gift" size={18} />} title="Mon code parrain"
          subtitle={copy.copied ? 'Copié !' : `${profile.referralCode} · touchez pour copier`}
          right={<Icon name="copy" size={18} />}
        />
        <ListRow as={Link} to={ROUTES.history} icon={<Icon name="history" size={18} />} title="Historique des transactions" right={<Icon name="chevron" size={18} />} />
        <ListRow icon={<Icon name="id" size={18} />} title="Vérification d'identité" subtitle="Nécessaire pour les gros retraits" right={soon} />
        <ListRow icon={<Icon name="shield" size={18} />} title="Jeu responsable" subtitle="Limites et pauses" right={soon} />
        <ListRow icon={<Icon name="bell" size={18} />} title="Notifications" right={soon} />
      </Card>

      <Button variant="danger" onClick={signOut}>Se déconnecter</Button>
    </>
  );
}
