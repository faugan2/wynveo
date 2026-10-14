import { useState } from 'react';
import { GAME, GAME_ICON } from '@wynveo/core';
import { LuckySpinGame } from './LuckySpinGame.jsx';
import { MysteryBoxGame } from './MysteryBoxGame.jsx';
import { LuckyNumberGame } from './LuckyNumberGame.jsx';
import { JackpotGame } from './JackpotGame.jsx';
import s from './games.module.css';

const GAMES = [
  { id: GAME.LUCKY_SPIN, short: 'Spin', Component: LuckySpinGame },
  { id: GAME.MYSTERY_BOX, short: 'Box', Component: MysteryBoxGame },
  { id: GAME.LUCKY_NUMBER, short: 'Number', Component: LuckyNumberGame },
  { id: GAME.JACKPOT, short: 'Jackpot', Component: JackpotGame },
];

/** Les 4 jeux côte à côte sur ordinateur, un à la fois avec un sélecteur sur mobile. */
export function GamesPage() {
  const [active, setActive] = useState(GAME.LUCKY_SPIN);
  return (
    <div className={s.page}>
      <div className={s.switch} role="tablist" aria-label="Choisir un jeu">
        {GAMES.map((g) => (
          <button key={g.id} type="button" role="tab" aria-selected={active === g.id}
            className={`${s.switchBtn} ${active === g.id ? s.switchOn : ''}`} onClick={() => setActive(g.id)}>
            <span aria-hidden>{GAME_ICON[g.id]}</span>{g.short}
          </button>
        ))}
      </div>
      <div className={s.grid}>
        {GAMES.map(({ id, Component }, i) => (
          <section key={id} className={`${s.col} ${active !== id ? s.hidden : ''}`} aria-labelledby={`game-${id}`}>
            <Component number={i + 1} headingId={`game-${id}`} />
          </section>
        ))}
      </div>
    </div>
  );
}
