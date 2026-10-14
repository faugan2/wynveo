import s from './Choice.module.css';
import { Icon } from './Icon.jsx';

/** Rangée de montants rapides ou d'options courtes. options: [{ value, label }] */
export function ChipGroup({ options, value, onChange, columns = 4, label }) {
  return (
    <div className={s.chips} style={{ '--cols': columns }} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value} type="button" aria-pressed={o.value === value}
          className={`${s.chip} ${o.value === value ? s.chipOn : ''}`}
          onClick={() => onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}

/** Onglets compacts mutuellement exclusifs. */
export function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className={s.seg} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value} type="button" role="tab" aria-selected={o.value === value}
          className={`${s.segItem} ${o.value === value ? s.segOn : ''}`} disabled={o.disabled}
          onClick={() => onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}

/** Choix exclusif présenté en carte (ex. opérateur Mobile Money). */
export function RadioCard({ selected, onSelect, badge, badgeStyle, title, subtitle, name }) {
  return (
    <button type="button" role="radio" aria-checked={selected} name={name}
      className={`${s.radio} ${selected ? s.radioOn : ''}`} onClick={onSelect}>
      {badge && <span className={s.badge} style={badgeStyle}>{badge}</span>}
      <span className={s.radioText}>{title}{subtitle && <small>{subtitle}</small>}</span>
      <span className={s.dot} aria-hidden />
    </button>
  );
}

export function Checkbox({ checked, onChange, children, error }) {
  return (
    <label className={`${s.check} ${error ? s.checkError : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={s.box}>{checked && <Icon name="check" size={14} strokeWidth={3} />}</span>
      <span>{children}</span>
    </label>
  );
}
