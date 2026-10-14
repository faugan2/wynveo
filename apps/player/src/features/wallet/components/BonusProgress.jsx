import { formatAmount, WELCOME_BONUS } from '@wynveo/core';
import { Card } from '../../../ui/index.js';

/** Avancement du bonus de bienvenue (montant restant à miser). */
export function BonusProgress({ wallet }) {
  if (!wallet.bonusBalance) return null;
  const required = wallet.bonusBalance * WELCOME_BONUS.wagerMultiplier;
  const done = Math.max(0, required - wallet.bonusWagerRemaining);
  const pct = required ? Math.min(100, (done / required) * 100) : 0;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem' }}>
        Bonus de bienvenue <span style={{ color: 'var(--gold)' }}>{formatAmount(wallet.bonusBalance)} FCFA</span>
      </div>
      <div style={{ height: 6, borderRadius: 9, background: 'var(--field)', margin: '9px 0 7px', overflow: 'hidden' }}>
        <i style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold-2), var(--gold))' }} />
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
        Misez encore {formatAmount(wallet.bonusWagerRemaining)} FCFA (jeux ou sport) pour pouvoir retirer ce bonus.
      </div>
    </Card>
  );
}
