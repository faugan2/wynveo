import { formatFCFA } from '@wynveo/core';
import { Button, Card, Money } from '../../ui/index.js';
import { ChestGrid, StakePicker } from '../../ui/games/index.jsx';
import { useMysteryBox } from '../../hooks/useMysteryBox.js';
import { GameHead, Features } from './GameParts.jsx';
import s from './games.module.css';

export function MysteryBoxGame({ number, headingId }) {
  const g = useMysteryBox();
  const opening = g.phase === 'opening';
  const done = g.phase === 'result';
  const r = g.result;
  return (
    <>
      <GameHead number={number} title="Mystery Box" id={headingId}>Choisissez une boîte et découvrez votre récompense !</GameHead>
      <Card>
        <p className={s.small} style={{ textAlign: 'center', marginBottom: 8 }}>
          {done ? 'Voici ce que contenaient les 9 boîtes.' : 'Touchez une boîte, puis ouvrez-la.'}
        </p>
        <ChestGrid
          count={g.boxCount} selected={g.selected} boxes={r?.outcome.boxes} opening={opening} revealed={done}
          onSelect={g.select} onRevealed={g.onRevealed}
        />
      </Card>
      {done && r ? (
        <Card tone="gold" style={{ textAlign: 'center', background: 'linear-gradient(180deg, #3a2a0a, var(--panel))' }}>
          <div className={s.small} style={{ fontWeight: 700 }}>{r.win > 0 ? 'VOUS GAGNEZ' : 'BOÎTE VIDE'}</div>
          <Money value={r.win} size={38} tone={r.win > 0 ? 'gold' : undefined} signed={r.win > 0} />
          <div className={s.small}>Mise de {formatFCFA(r.stake)} · {r.multiplier}x</div>
          {r.bonusUnlocked > 0 && <div style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 4 }}>Bonus débloqué : +{formatFCFA(r.bonusUnlocked)}</div>}
          <Button variant="purple" block style={{ marginTop: 10 }} onClick={g.playAgain}>Rejouer</Button>
        </Card>
      ) : (
        <Card className={s.box}>
          <StakePicker stake={g.stake} balance={g.balance} disabled={opening || g.pending} />
          {g.error && <p className={s.err} role="alert">{g.error}</p>}
          <Button variant="purple" block onClick={g.play} loading={g.pending} disabled={opening || g.selected === null}>
            {g.selected === null ? 'Choisir une boîte' : `Ouvrir la boîte ${g.selected + 1}`}
          </Button>
        </Card>
      )}
      <Card><Features items={[['🎁', 'Des récompenses surprises'], ['💎', 'Gains instantanés'], ['⭐', "Jusqu'à 10x votre mise"]]} /></Card>
    </>
  );
}
