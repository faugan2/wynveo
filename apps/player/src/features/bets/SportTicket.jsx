import { SPORTS, formatAmount, marketLabel } from '@wynveo/core';
import { Card, Pill } from '../../ui/index.js';
import { formatOdds, formatTime } from '../../ui/sport/index.jsx';

const STATUS = {
  pending: { tone: 'warn', label: 'En cours' },
  won: { tone: 'good', label: 'Gagné' },
  lost: { tone: 'bad', label: 'Perdu' },
  void: { tone: 'info', label: 'Remboursé' },
};
const SEL = { pending: { c: 'var(--fg-dim)', t: '…' }, won: { c: 'var(--green-text)', t: '✓' }, lost: { c: 'var(--red-text)', t: '✕' }, void: { c: 'var(--blue-text)', t: '↺' } };
const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** Ticket sportif dans « Mes paris » : choix, cote, mise et gain. */
export function SportTicket({ bet }) {
  const st = STATUS[bet.status] ?? STATUS.pending;
  const combo = bet.type === 'combo';
  return (
    <Card style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{combo ? `Combiné · ${bet.selections.length} matchs` : 'Simple'}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--fg-dim)' }}>{formatTime(bet.createdAt)} · {bet.reference}</div>
        </div>
        <Pill tone={st.tone}>{st.label}</Pill>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {bet.selections.map((x) => {
          const m = SEL[x.status] ?? SEL.pending;
          return (
            <li key={`${x.eventId}${x.market}`} style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: 'var(--fg-muted)' }}>
              <span aria-label={x.status} style={{ width: 22, height: 22, borderRadius: 6, flex: 'none', display: 'grid', placeItems: 'center', background: 'var(--panel-2)', color: m.c, fontWeight: 800 }}>{m.t}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 600 }}>{x.pick} <span style={{ color: 'var(--fg-dim)', fontWeight: 400 }}>· {marketLabel(x.sport, x.market)}</span></div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{SPORTS[x.sport]?.icon} {x.event}</div>
                <div style={{ color: 'var(--fg-dim)' }}>{x.league} · {x.startAt ? `${DATE.format(x.startAt)} ${formatTime(x.startAt)}` : ''}</div>
              </div>
              <b style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{formatOdds(x.odds)}</b>
            </li>
          );
        })}
      </ul>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, borderTop: '1px solid var(--line-soft)', paddingTop: 10, fontSize: '0.74rem', color: 'var(--fg-dim)' }}>
        <div>Mise<br /><b style={{ color: '#fff', fontSize: '0.9rem' }}>{formatAmount(bet.stake)}</b></div>
        <div>Cote<br /><b style={{ color: '#fff', fontSize: '0.9rem' }}>{formatOdds(bet.finalOdds || bet.totalOdds)}</b></div>
        <div style={{ textAlign: 'right' }}>
          {bet.status === 'pending' ? 'Gain possible' : bet.status === 'void' ? 'Remboursé' : 'Gain'}<br />
          <b style={{ fontSize: '0.95rem', color: bet.status === 'won' ? 'var(--green-text)' : bet.status === 'pending' ? 'var(--gold)' : '#fff' }}>
            {formatAmount(bet.status === 'pending' ? bet.potentialWin : bet.win)} F
          </b>
        </div>
      </div>
    </Card>
  );
}
