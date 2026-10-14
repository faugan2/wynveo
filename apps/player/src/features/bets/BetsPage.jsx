import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GAME_LABEL, GAME_ICON, BET_RESULT, betResult, formatAmount, formatSigned } from '@wynveo/core';
import { Card, EmptyState, Pill, SectionTitle, SegmentedControl, Skeleton } from '../../ui/index.js';
import { BallRow } from '../../ui/games/index.jsx';
import { SportTicket } from './SportTicket.jsx';
import { useMyBets } from '../../hooks/useMyBets.js';
import { ROUTES } from '../../app/routes.js';

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function groupByDay(items) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const out = [];
  for (const b of items) {
    const key = b.createdAt.toDateString();
    const label = key === today ? "Aujourd'hui" : key === yesterday ? 'Hier' : DAY.format(b.createdAt);
    const last = out[out.length - 1];
    if (last?.label === label) last.items.push(b); else out.push({ label, items: [b] });
  }
  return out;
}

function detail(b) {
  if (b.game === 'lucky_number') {
    return (
      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
        <BallRow numbers={b.numbers} hits={b.outcome?.drawn ?? []} label="Vos numéros" />
        {b.outcome?.drawn
          ? <BallRow numbers={b.outcome.drawn} gold label="Numéros tirés" />
          : <span style={{ fontSize: '0.78rem', color: 'var(--fg-dim)' }}>Tirage à {TIME.format(b.drawAt)}</span>}
      </div>
    );
  }
  if (b.game === 'mystery_box' && b.outcome) return <span>Boîte {b.outcome.chosen + 1} · {b.multiplier}x</span>;
  if (b.game === 'lucky_spin' && b.outcome) return <span>Roue arrêtée sur {b.multiplier}x</span>;
  if (b.game === 'jackpot') {
    return <span>{b.tickets} ticket(s){b.status === 'pending' ? ' · tirage à 20:00' : b.outcome?.winningTicket ? ` · ticket gagnant n° ${b.outcome.winningTicket} sur ${b.outcome.totalTickets}` : ''}</span>;
  }
  return null;
}

export function BetsPage() {
  const location = useLocation();
  const [product, setProduct] = useState(location.state?.product ?? 'games');
  const { items, loading, summary } = useMyBets({ product });
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase' }}>Mes paris</h1>
      <SegmentedControl label="Type de paris" value={product} onChange={setProduct}
        options={[{ value: 'games', label: '🎰 Jeux' }, { value: 'sport', label: '⚽ Sport' }]} />

      {product === 'sport' ? (
        <>
          <Card style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', padding: '10px 6px' }}>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>Misé</div><b>{formatAmount(summary.staked)}</b></div>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>En attente</div><b>{summary.pending}</b></div>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>Bilan</div><b style={{ color: summary.net >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{formatSigned(summary.net + summary.pendingStake)}</b></div>
          </Card>
          {loading && <Card style={{ display: 'grid', gap: 10 }}><Skeleton height={64} /><Skeleton height={64} /></Card>}
          {!loading && items.length === 0 && (
            <Card><EmptyState icon="sport" title="Pas encore de ticket">Choisissez vos matchs dans <Link to={ROUTES.sport}>Sport</Link>.</EmptyState></Card>
          )}
          {groupByDay(items).map((g) => (
            <section key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionTitle>{g.label}</SectionTitle>
              {g.items.map((b) => <SportTicket key={b.id} bet={b} />)}
            </section>
          ))}
        </>
      ) : (
        <>
          <Card style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', padding: '10px 6px' }}>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>Misé</div><b>{formatAmount(summary.staked)}</b></div>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>Gagné</div><b style={{ color: 'var(--green-text)' }}>{formatAmount(summary.won)}</b></div>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>Bilan</div><b style={{ color: summary.net >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{formatSigned(summary.net)}</b></div>
          </Card>
          {loading && <Card style={{ display: 'grid', gap: 10 }}><Skeleton height={44} /><Skeleton height={44} /></Card>}
          {!loading && items.length === 0 && (
            <Card><EmptyState icon="bets" title="Pas encore de partie">Lancez votre première partie dans <Link to={ROUTES.games}>Jeux</Link>.</EmptyState></Card>
          )}
          {groupByDay(items).map((g) => (
            <section key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionTitle>{g.label}</SectionTitle>
              <Card flush>
                {g.items.map((b) => {
                  const { tone, label } = BET_RESULT[betResult(b)];
                  return (
                    <div key={b.id} style={{ padding: '11px 0', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: 12 }}>
                      <span aria-hidden style={{ width: 38, height: 38, borderRadius: 10, background: '#241e5c', display: 'grid', placeItems: 'center', fontSize: 19, flex: 'none' }}>{GAME_ICON[b.game]}</span>
                      <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', color: 'var(--fg-muted)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{GAME_LABEL[b.game]}</div>
                        <div>{TIME.format(b.createdAt)} · Mise {formatAmount(b.stake)} · {b.reference}</div>
                        {detail(b)}
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {b.status !== 'pending' && <b style={{ color: b.win > b.stake ? 'var(--green-text)' : 'var(--fg-dim)' }}>{b.win > 0 ? `+${formatAmount(b.win)}` : '0'}</b>}
                        <Pill tone={tone}>{label}</Pill>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </>
      )}
    </>
  );
}
