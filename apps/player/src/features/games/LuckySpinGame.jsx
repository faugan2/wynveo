import { formatFCFA } from '@wynveo/core';
import { Button, Card, KeyValueList } from '../../ui/index.js';
import { Wheel, StakePicker, ResultModal } from '../../ui/games/index.jsx';
import { useLuckySpin } from '../../hooks/useLuckySpin.js';
import { GameHead, Features } from './GameParts.jsx';
import s from './games.module.css';

export function LuckySpinGame({ number, headingId }) {
  const g = useLuckySpin();
  const busy = g.pending || g.phase === 'spinning';
  const r = g.result;
  const won = r && r.multiplier >= 1;
  return (
    <>
      <GameHead number={number} title="Lucky Spin" id={headingId}>
        Faites tourner la roue et gagnez jusqu'à <span className={s.hl}>50x</span> votre mise !
      </GameHead>
      <Card tone="glow" className={s.box}>
        <Wheel segments={g.segments} spinId={g.spinId} targetIndex={g.targetIndex} spinning={g.phase === 'spinning'} onDone={g.onSpinEnd} />
        <StakePicker stake={g.stake} balance={g.balance} disabled={busy} />
        {g.error && <p className={s.err} role="alert">{g.error}</p>}
        <Button block onClick={g.play} loading={g.pending} disabled={busy} sub="Appuyez pour faire tourner">Tourner</Button>
      </Card>
      <Card><Features items={[['🏆', 'Gain instantané'], ['⚡', 'Simple et rapide'], ['🎁', "Jusqu'à 50x votre mise"]]} /></Card>

      {g.phase === 'result' && r && (
        <ResultModal onClose={g.closeResult} lose={!won} label="Résultat Lucky Spin">
          <div style={{ fontSize: 48, lineHeight: 1 }} aria-hidden>{won ? '🎉' : '🍀'}</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase' }}>
            {r.multiplier > 1 ? 'Félicitations !' : r.multiplier === 1 ? 'Mise remboursée' : 'Pas de chance'}
          </h3>
          <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>La roue s'est arrêtée sur</p>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 60, lineHeight: 1, color: 'var(--gold)' }}>{r.multiplier}x</div>
          <Card style={{ background: 'var(--field)', padding: '6px 12px', textAlign: 'left' }}>
            <KeyValueList rows={[
              { label: 'Mise', value: formatFCFA(r.stake) },
              { label: 'Gain', value: formatFCFA(r.win), tone: r.win > r.stake ? 'good' : undefined },
              r.bonusUnlocked > 0 && { label: 'Bonus débloqué', value: `+${formatFCFA(r.bonusUnlocked)}`, tone: 'gold' },
            ]} />
          </Card>
          <Button block onClick={() => { g.closeResult(); g.play(); }}>Rejouer · {formatFCFA(g.stake.stake)}</Button>
          <Button variant="link" onClick={g.closeResult}>Fermer</Button>
        </ResultModal>
      )}
    </>
  );
}
