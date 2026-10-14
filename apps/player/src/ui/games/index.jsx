/** Composants visuels des jeux : uniquement de l'affichage, aucun appel aux services. */
import { useEffect, useRef } from 'react';
import { formatAmount } from '@wynveo/core';
import s from './games.module.css';

export { Wheel } from './Wheel.jsx';
export { ChestGrid } from './ChestGrid.jsx';

export function Ball({ n, on, gold, hit }) {
  return <span className={`${s.ball} ${on ? s.ballOn : ''} ${gold ? s.ballGold : ''} ${hit ? s.ballHit : ''}`}>{n}</span>;
}

export function BallRow({ numbers, gold, hits = [], label }) {
  return (
    <div className={s.ballRow} aria-label={label}>
      {numbers.map((n) => <Ball key={n} n={n} on={!gold} gold={gold} hit={hits.includes(n)} />)}
    </div>
  );
}

/** Grille 1..max. Les numéros choisis sont verts ; une fois `full`, les autres sont désactivés. */
export function NumberGrid({ max, selected, onToggle, full, disabled }) {
  return (
    <div className={s.grid} role="group" aria-label="Choisissez vos numéros">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const on = selected.includes(n);
        return (
          <button
            key={n} type="button" aria-pressed={on} className={`${s.ball} ${on ? s.ballOn : ''}`}
            disabled={disabled || (full && !on)} onClick={() => onToggle(n)}
          >{n}</button>
        );
      })}
    </div>
  );
}

/** Choix de la mise : − / + et montants rapides. `stake` vient de useStake(). */
export function StakePicker({ stake, balance, disabled, label = 'Montant de la mise', unit = 'FCFA' }) {
  return (
    <div className={s.stake}>
      <div className={s.stakeTop}><span>{label}</span><span>Solde : {formatAmount(balance)} FCFA</span></div>
      <div className={s.stepper}>
        <button type="button" onClick={stake.decrease} disabled={disabled || stake.stake <= stake.min} aria-label="Diminuer la mise">−</button>
        <output aria-live="polite">{formatAmount(stake.stake)} {unit}</output>
        <button type="button" onClick={stake.increase} disabled={disabled || stake.stake >= stake.max} aria-label="Augmenter la mise">+</button>
      </div>
      <QuickChips values={stake.quickStakes} value={stake.stake} onChange={stake.setStake} disabled={disabled} />
    </div>
  );
}

export function QuickChips({ values, value, onChange, disabled, format = formatAmount }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`, gap: 6 }}>
      {values.map((v) => (
        <button
          key={v} type="button" disabled={disabled} aria-pressed={v === value} onClick={() => onChange(v)}
          style={{
            minHeight: 36, borderRadius: 7, background: 'var(--field)', fontSize: '0.82rem', fontWeight: 600,
            border: `1px solid ${v === value ? 'var(--gold)' : 'var(--line-soft)'}`, color: v === value ? 'var(--gold)' : 'inherit',
          }}
        >{format(v)}</button>
      ))}
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');

/** Compte à rebours HEURES : MIN : SEC (heures masquables). */
export function Countdown({ h, m, s: sec, showHours = true, gold }) {
  const parts = [...(showHours ? [[h, 'HEURES']] : []), [m, 'MIN'], [sec, 'SEC']];
  return (
    <div className={`${s.timer} ${gold ? s.timerGold : ''}`} role="timer" aria-label={`${showHours ? `${h} h ` : ''}${m} min ${sec} s`}>
      {parts.map(([v, l], i) => (
        <span key={l} style={{ display: 'contents' }}>
          {i > 0 && <span className={s.sep} aria-hidden>:</span>}
          <div><b>{pad(v)}</b><small>{l}</small></div>
        </span>
      ))}
    </div>
  );
}

/** Fenêtre de résultat. Se ferme avec Échap ou le bouton fourni par l'appelant. */
export function ResultModal({ children, onClose, lose, label = 'Résultat' }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className={`${s.modal} ${lose ? s.modalLose : ''}`}>
        {children}
      </div>
    </div>
  );
}
