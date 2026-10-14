import { formatAmount, formatFCFA } from '@wynveo/core';
import { Button, Card, Pill } from '../../ui/index.js';
import { BallRow, Countdown, NumberGrid, StakePicker } from '../../ui/games/index.jsx';
import { useLuckyNumber } from '../../hooks/useLuckyNumber.js';
import { GameHead, Features } from './GameParts.jsx';
import s from './games.module.css';

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function LuckyNumberGame({ number, headingId }) {
  const g = useLuckyNumber();
  const lastDraw = g.recentDraws[0];
  return (
    <>
      <GameHead number={number} title="Lucky Number" id={headingId}>Choisissez vos numéros et gagnez des gros lots !</GameHead>
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>PROCHAIN TIRAGE À {TIME.format(g.nextDraw.drawAt)}</div>
        <Countdown {...g.countdown} />
        {g.demo && <button type="button" className={s.demo} style={{ marginTop: 8 }} onClick={g.demo.drawNumbersNow}>Démo : tirer maintenant</button>}
      </Card>

      <Card className={s.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: '0.88rem' }}>Choisissez {g.config.pick} numéros</b>
          <Button variant="link" onClick={g.quickPick}>Au hasard</Button>
        </div>
        <NumberGrid max={g.config.maxNumber} selected={g.picks} onToggle={g.toggle} full={g.full} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34 }}>
          <span className={s.small} style={{ fontWeight: 700 }}>Vos numéros :</span>
          {g.picks.length ? <BallRow numbers={g.picks} /> : <span className={s.small}>aucun</span>}
          {g.picks.length > 0 && <Button variant="link" onClick={g.clear} style={{ marginLeft: 'auto' }}>Effacer</Button>}
        </div>
      </Card>

      <Card className={s.box}>
        <StakePicker stake={g.stake} balance={g.balance} disabled={g.pending} />
        {g.error && <p className={s.err} role="alert">{g.error}</p>}
        <Button variant="blue" block onClick={g.buy} loading={g.pending} disabled={!g.full}>
          {g.full ? `Jouer · ${formatFCFA(g.stake.stake)}` : `Encore ${g.config.pick - g.picks.length} numéro(s)`}
        </Button>
        {g.lastTicket && (
          <p className={s.small} style={{ textAlign: 'center', color: 'var(--green-text)' }} role="status">
            Ticket enregistré pour le tirage de {TIME.format(new Date(g.lastTicket.drawAt))}.
          </p>
        )}
      </Card>

      {g.myTickets.length > 0 && (
        <Card>
          <b style={{ fontSize: '0.85rem' }}>Mes tickets pour {TIME.format(g.nextDraw.drawAt)}</b>
          {g.myTickets.map((t) => (
            <div key={t.id} className={s.row}><BallRow numbers={t.numbers} /><span>{formatAmount(t.stake)}</span></div>
          ))}
        </Card>
      )}

      {lastDraw && (
        <Card>
          <b style={{ fontSize: '0.85rem' }}>Dernier tirage · {TIME.format(lastDraw.drawAt)}</b>
          <div style={{ marginTop: 8 }}><BallRow numbers={lastDraw.numbers} gold label="Numéros tirés" /></div>
          {g.myResults.filter((b) => b.drawId === lastDraw.id).map((b) => (
            <div key={b.id} className={s.row}>
              <BallRow numbers={b.numbers} hits={lastDraw.numbers} />
              {b.win > 0
                ? <Pill tone="good">{b.outcome?.matches} bons · +{formatAmount(b.win)}</Pill>
                : <Pill tone="bad">{b.outcome?.matches ?? 0} bon{(b.outcome?.matches ?? 0) > 1 ? 's' : ''} numéro{(b.outcome?.matches ?? 0) > 1 ? 's' : ''}</Pill>}
            </div>
          ))}
        </Card>
      )}

      <Card>
        <b style={{ fontSize: '0.85rem' }}>Gains pour {formatFCFA(g.stake.stake)}</b>
        {g.payTable.map((p) => (
          <div key={p.matches} className={s.row}><span>{p.matches} bons numéros · {p.multiplier}x</span><b style={{ color: 'var(--gold)' }}>{formatFCFA(p.example)}</b></div>
        ))}
      </Card>
      <Card><Features items={[['🎯', `Tirage toutes les ${g.config.intervalMinutes} minutes`], ['🛡️', 'Plusieurs gains possibles'], ['🥇', "Jusqu'à 1 000 000 FCFA"]]} /></Card>
    </>
  );
}
