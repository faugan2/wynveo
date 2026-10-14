import { Link } from 'react-router-dom';
import { formatAmount, withdrawableAmount, displayBalance } from '@wynveo/core';
import { Button, Card, Money } from '../../../ui/index.js';
import { ROUTES } from '../../../app/routes.js';

/** Grande carte du solde partagé Jeux + Sport, avec Dépôt / Retrait. */
export function BalanceHero({ wallet, compact }) {
  return (
    <Card tone="hero" style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: 12, alignItems: compact ? 'center' : 'stretch' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.06em' }}>
          {compact ? 'MON SOLDE' : 'SOLDE DISPONIBLE · JEUX & SPORT'}
        </div>
        <div style={{ margin: '4px 0' }}><Money value={displayBalance(wallet)} size={compact ? 32 : 44} /></div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--fg-muted)' }}>
          <span>Retirable : <b style={{ color: '#fff' }}>{formatAmount(withdrawableAmount(wallet))}</b></span>
          <span>Bonus : <b style={{ color: 'var(--gold)' }}>{formatAmount(wallet.bonusBalance)}</b></span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 8 }}>
        <Button as={Link} to={ROUTES.deposit} size={compact ? 'small' : undefined}>+ Déposer</Button>
        <Button as={Link} to={ROUTES.withdraw} variant="ghost" size={compact ? 'small' : undefined}>Retirer</Button>
      </div>
    </Card>
  );
}
