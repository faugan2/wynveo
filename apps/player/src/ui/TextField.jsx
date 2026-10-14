import { useId } from 'react';
import s from './Field.module.css';

/** Champ texte avec libellé, préfixe facultatif (ex. "+228") et message d'erreur. */
export function TextField({ label, optional, prefix, suffix, error, hint, big, id, className = '', ...inputProps }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={`${s.field} ${className}`}>
      {label && (
        <label className={s.label} htmlFor={inputId}>
          {label} {optional && <small>(facultatif)</small>}
        </label>
      )}
      <div className={`${s.box} ${error ? s.invalid : ''}`}>
        {prefix && <span className={s.prefix}>{prefix}</span>}
        <input
          id={inputId}
          className={`${s.input} ${big ? s.big : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? msgId : undefined}
          {...inputProps}
        />
        {suffix && <span className={s.suffix}>{suffix}</span>}
      </div>
      {error ? <p id={msgId} className={s.error} role="alert">{error}</p>
        : hint ? <p id={msgId} className={s.hint}>{hint}</p> : null}
    </div>
  );
}
