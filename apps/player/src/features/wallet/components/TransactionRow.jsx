import {
  OPERATORS, TX_TYPE, TX_STATUS, TX_TYPE_LABEL, TX_STATUS_LABEL, statusTone, signedAmount, formatSigned,
} from '@wynveo/core';
import { Icon, ListRow, Pill } from '../../../ui/index.js';

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

const LOOK = {
  [TX_TYPE.DEPOSIT]: { icon: 'down', bg: '#22b14c33', color: 'var(--green-text)' },
  [TX_TYPE.WITHDRAWAL]: { icon: 'up', bg: '#0ea5e933', color: '#7dd3fc' },
  [TX_TYPE.BONUS]: { icon: 'gift', bg: '#f59e0b33', color: 'var(--gold)' },
  [TX_TYPE.BET]: { icon: 'bets', bg: '#7c3aed33', color: '#c4a8ff' },
  [TX_TYPE.WIN]: { icon: 'check', bg: '#22b14c33', color: 'var(--green-text)' },
  [TX_TYPE.REFUND]: { icon: 'back', bg: '#2f7cf633', color: 'var(--blue-text)' },
  [TX_TYPE.ADJUSTMENT]: { icon: 'info', bg: '#2a2468', color: 'var(--fg-muted)' },
  [TX_TYPE.BONUS_UNLOCK]: { icon: 'gift', bg: '#22b14c33', color: 'var(--green-text)' },
};

function title(tx) {
  if (tx.label) return tx.label;
  const op = OPERATORS[tx.operator]?.name.split(' ')[0];
  return op ? `${TX_TYPE_LABEL[tx.type]} ${op}` : TX_TYPE_LABEL[tx.type] ?? tx.type;
}

/** Une opération dans une liste. */
export function TransactionRow({ tx }) {
  const look = LOOK[tx.type] ?? LOOK[TX_TYPE.ADJUSTMENT];
  const settled = tx.status === TX_STATUS.SUCCESS;
  const amount = signedAmount(tx);
  const failed = tx.status === TX_STATUS.FAILED || tx.status === TX_STATUS.REJECTED;
  const subtitle = [TIME.format(tx.createdAt), tx.reference, failed && tx.failureReason].filter(Boolean).join(' · ');
  return (
    <ListRow
      icon={<Icon name={look.icon} size={18} />}
      iconStyle={{ background: look.bg, color: look.color }}
      title={title(tx)}
      subtitle={subtitle}
      right={(
        <>
          <span style={{
            fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: failed ? 'var(--fg-dim)' : amount > 0 ? 'var(--green-text)' : 'var(--fg)',
            textDecoration: failed ? 'line-through' : 'none',
          }}>{formatSigned(amount)}</span>
          {!settled && <Pill tone={statusTone(tx.status)}>{TX_STATUS_LABEL[tx.status]}</Pill>}
        </>
      )}
    />
  );
}
