import { useEffect } from 'react';
import s from './games.module.css';

function Chest({ open }) {
  return (
    <svg viewBox="0 0 100 86" aria-hidden className={open ? s.open : ''}>
      <defs>
        <linearGradient id="wyCb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9b4dff" /><stop offset="1" stopColor="#4c1d95" /></linearGradient>
        <linearGradient id="wyCg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#c47f12" /></linearGradient>
        <radialGradient id="wyCl"><stop offset="0" stopColor="#fff2a8" /><stop offset="1" stopColor="#ffb000" stopOpacity="0" /></radialGradient>
      </defs>
      {open && <ellipse cx="50" cy="36" rx="48" ry="34" fill="url(#wyCl)" />}
      <g className={s.lid}>
        <path d="M10 38 Q10 8 50 8 Q90 8 90 38 Z" fill="url(#wyCb)" stroke="url(#wyCg)" strokeWidth="4" />
        <rect x="26" y="9" width="8" height="29" fill="url(#wyCg)" /><rect x="66" y="9" width="8" height="29" fill="url(#wyCg)" />
      </g>
      <rect x="10" y="38" width="80" height="40" rx="4" fill="url(#wyCb)" stroke="url(#wyCg)" strokeWidth="4" />
      <rect x="26" y="38" width="8" height="40" fill="url(#wyCg)" /><rect x="66" y="38" width="8" height="40" fill="url(#wyCg)" />
      {!open && <><rect x="40" y="32" width="20" height="24" rx="4" fill="url(#wyCg)" stroke="#8a5300" strokeWidth="1.5" /><circle cx="50" cy="42" r="3.5" fill="#5a3300" /></>}
    </svg>
  );
}

const prizeLabel = (m) => (m === 0 ? 'Vide' : `${m}x`);

/**
 * 9 coffres. `boxes` (multiplicateurs) est fourni une fois le résultat connu.
 * Pendant `opening`, le coffre choisi tremble ~1 s puis onRevealed() est appelé.
 */
export function ChestGrid({ count, selected, boxes, opening, revealed, onSelect, onRevealed }) {
  useEffect(() => {
    if (!opening) return undefined;
    const id = setTimeout(() => onRevealed?.(), 1000);
    return () => clearTimeout(id);
  }, [opening]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={s.chests} role="radiogroup" aria-label="Choisissez une boîte">
      {Array.from({ length: count }, (_, i) => {
        const isSel = i === selected;
        const show = revealed && boxes;
        return (
          <button
            key={i} type="button" role="radio" aria-checked={isSel} aria-label={`Boîte ${i + 1}${show ? ` : ${prizeLabel(boxes[i])}` : ''}`}
            className={`${s.chest} ${isSel ? s.chestSel : ''} ${show && !isSel ? s.chestDim : ''} ${opening && isSel ? s.shake : ''}`}
            disabled={opening} onClick={() => onSelect(i)}
          >
            <Chest open={show} />
            {show && <span className={s.prize} style={isSel ? { fontSize: '1.4rem', color: 'var(--gold)' } : undefined}>{prizeLabel(boxes[i])}</span>}
          </button>
        );
      })}
    </div>
  );
}
