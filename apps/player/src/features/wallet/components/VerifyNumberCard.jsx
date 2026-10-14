import { Link } from 'react-router-dom';
import { formatFCFA, formatPhone, WELCOME_BONUS } from '@wynveo/core';
import { Button, Card, Icon } from '../../../ui/index.js';
import { ROUTES } from '../../../app/routes.js';

/**
 * Invite à confirmer le numéro par un premier dépôt Mobile Money depuis ce numéro.
 * Tant que ce n'est pas fait : pas de retrait, pas de bonus de bienvenue.
 */
export function VerifyNumberCard({ phone, compact }) {
  return (
    <Card tone="gold" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(180deg, #3a2a0a, var(--panel))' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', display: 'grid', placeItems: 'center', background: '#f59e0b33', color: 'var(--gold)' }}>
          <Icon name="phone" />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>Confirmez votre numéro</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)', marginTop: 2 }}>
            Faites votre premier dépôt depuis le <b style={{ color: '#fff' }}>{formatPhone(phone)}</b>.
            La validation avec votre code secret Mobile Money prouve que ce numéro est à vous
            {compact ? '.' : <> et débloque les retraits et le bonus de bienvenue ({WELCOME_BONUS.rate * 100} % jusqu'à {formatFCFA(WELCOME_BONUS.cap)}).</>}
          </p>
        </div>
      </div>
      <Button as={Link} to={ROUTES.deposit} size="small">Faire mon premier dépôt</Button>
    </Card>
  );
}
