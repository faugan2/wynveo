import { formatAmount, formatFCFA } from '@wynveo/core';
import { Button, Card } from '../../ui/index.js';
import { Countdown, QuickChips } from '../../ui/games/index.jsx';
import { useJackpot } from '../../hooks/useJackpot.js';
import { GameHead, Features } from './GameParts.jsx';
import s from './games.module.css';

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

export function JackpotGame({ number, headingId }) {
  const g = useJackpot();
  return (
    <>
      <GameHead number={number} title="Jackpot quotidien" id={headingId}>Participez chaque jour et tentez de gagner le jackpot !</GameHead>
      <div className={s.jpHero}>
        <span className={s.coin} style={{ left: '4%', top: '18%' }} /><span className={s.coin} style={{ right: '6%', top: '10%', animationDelay: '0.6s' }} />
        <span className={s.coin} style={{ right: '2%', bottom: '30%', animationDelay: '1.2s', width: 15, height: 15 }} />
        <div className={s.crown} aria-hidden>👑</div>
        <div className={s.jpBox}>
          <div className={s.jpTitle}>Jackpot du jour</div>
          <div className={s.jpAmount} aria-live="polite">{formatAmount(g.pool)}</div>
          <div className={s.jpAmount} style={{ fontSize: '1.6rem' }}>FCFA</div>
        </div>
      </div>
      <Card style={{ textAlign: 'center', borderColor: 'var(--gold-2)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Tirage à 20:00 · dans</div>
        <Countdown {...g.countdown} gold />
        {g.demo && <button type="button" className={s.demo} style={{ marginTop: 8 }} onClick={g.demo.drawJackpotNow}>Démo : tirer maintenant</button>}
      </Card>
      <div className={s.pill}>👥 {g.players} participation(s) · {formatAmount(g.totalTickets)} ticket(s)</div>

      <Card className={s.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
          <span>Nombre de tickets · {formatFCFA(g.config.ticketPrice)} l'unité</span>
          <span style={{ color: 'var(--fg-muted)' }}>Solde : {formatAmount(g.balance)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', height: 44, background: 'var(--field)', border: '1px solid var(--line-soft)', borderRadius: 8 }}>
          <button type="button" style={{ width: 46, height: '100%', border: 0, background: 'none', fontSize: '1.4rem' }} onClick={() => g.setTickets(g.tickets - 1)} aria-label="Un ticket de moins">−</button>
          <output style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>{g.tickets} ticket{g.tickets > 1 ? 's' : ''} · {g.costLabel}</output>
          <button type="button" style={{ width: 46, height: '100%', border: 0, background: 'none', fontSize: '1.4rem' }} onClick={() => g.setTickets(g.tickets + 1)} aria-label="Un ticket de plus">+</button>
        </div>
        <QuickChips values={g.config.quickTickets} value={g.tickets} onChange={g.setTickets} format={(n) => `×${n}`} />
        {g.error && <p className={s.err} role="alert">{g.error}</p>}
        <Button variant="orange" block onClick={g.buy} loading={g.pending}>Participer · {g.costLabel}</Button>
        {g.myTickets > 0 && <p className={s.small} style={{ textAlign: 'center' }}>Vos chances aujourd'hui : <b style={{ color: '#fff' }}>{g.chances}</b></p>}
        {g.confirmation && <p className={s.small} style={{ textAlign: 'center', color: 'var(--green-text)' }} role="status">{g.confirmation.tickets} ticket(s) ajouté(s). Bonne chance !</p>}
      </Card>

      {g.winners.length > 0 && (
        <Card>
          <b style={{ fontSize: '0.85rem' }}>Derniers gagnants</b>
          {g.winners.map((w) => (
            <div key={w.id} className={s.row}>
              <span>{w.winner ? w.winner.name : 'Aucun participant'} <span className={s.small}>· {DAY.format(w.drawAt)}</span></span>
              <b style={{ color: 'var(--gold)' }}>{w.winner ? formatAmount(w.winner.amount) : 'Reporté'}</b>
            </div>
          ))}
        </Card>
      )}
      <Card><Features items={[['👑', '1 tirage par jour à 20:00'], ['🎟️', `${Math.round(g.config.poolShare * 100)} % des tickets vont à la cagnotte`], ['💰', '1 gagnant remporte toute la cagnotte']]} /></Card>
    </>
  );
}
