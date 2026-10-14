import { useState } from 'react';
import s from './OtpInput.module.css';

/** Saisie d'un code à N chiffres. Un vrai champ caché reçoit la saisie (collage et remplissage SMS compris). */
export function OtpInput({ length = 6, value, onChange, invalid, autoFocus, label = 'Code reçu par SMS' }) {
  const [focused, setFocused] = useState(false);
  const cells = Array.from({ length }, (_, i) => value[i] ?? '');
  return (
    <div className={`${s.wrap} ${invalid ? s.invalid : ''}`}>
      {cells.map((c, i) => (
        <div key={i} className={`${s.cell} ${focused && i === Math.min(value.length, length - 1) ? s.active : ''}`} aria-hidden>{c}</div>
      ))}
      <input
        className={s.input}
        aria-label={label}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
