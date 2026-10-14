import { formatAmount, CURRENCY } from '@wynveo/core';
import s from './Display.module.css';
import { Icon } from './Icon.jsx';

/** Pastille de statut. tone : good | bad | warn | info */
export function Pill({ tone = 'info', children }) {
  return <span className={`${s.pill} ${s[tone]}`}>{children}</span>;
}

/** Encadré d'information. tone : info | warn | error */
export function Notice({ tone = 'info', icon, children }) {
  const cls = { info: s.nInfo, warn: s.nWarn, error: s.nError }[tone];
  return (
    <div className={`${s.notice} ${cls}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={icon ?? (tone === 'info' ? 'info' : 'shield')} size={18} />
      <div>{children}</div>
    </div>
  );
}

/** Ligne de liste (opération, entrée de menu…). `as` permet d'en faire un lien. */
export function ListRow({ as: As = 'div', icon, iconStyle, title, subtitle, right, ...rest }) {
  return (
    <As className={s.row} {...rest}>
      {icon && <span className={s.rowIcon} style={iconStyle}>{icon}</span>}
      <span className={s.rowText}>
        <span className={s.rowTitle}>{title}</span>
        {subtitle && <span className={s.rowSub}>{subtitle}</span>}
      </span>
      {right && <span className={s.rowRight}>{right}</span>}
    </As>
  );
}

/** Liste libellé / valeur. rows : [{ label, value, tone: 'good'|'gold' }] */
export function KeyValueList({ rows }) {
  return (
    <dl style={{ margin: 0 }}>
      {rows.filter(Boolean).map((r) => (
        <div key={r.label} className={`${s.kv} ${r.tone === 'good' ? s.kvGood : r.tone === 'gold' ? s.kvGold : ''}`}>
          <dt>{r.label}</dt><dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Montant en FCFA en grands chiffres. tone : positive | negative | gold */
export function Money({ value, size = 28, tone, signed, currency = true }) {
  const n = Math.round(value ?? 0);
  const sign = signed && n > 0 ? '+' : '';
  const cls = [s.money, tone === 'positive' && s.mPositive, tone === 'negative' && s.mNegative, tone === 'gold' && s.mGold].filter(Boolean).join(' ');
  return (
    <span className={cls} style={{ fontSize: size }}>
      {sign}{formatAmount(n)}{currency && <small>{CURRENCY}</small>}
    </span>
  );
}

/** Étapes d'un processus. items : [{ title, subtitle, state: 'done'|'current'|'todo' }] */
export function Timeline({ items }) {
  return (
    <ol className={s.tl}>
      {items.map((it) => (
        <li key={it.title} className={`${s.tlItem} ${it.state === 'done' ? s.tlDone : ''} ${it.state === 'current' ? s.tlCurrent : ''}`}>
          <span className={s.tlDot}>
            {it.state === 'done' ? <Icon name="check" size={15} strokeWidth={3} /> : it.state === 'current' ? <span className={s.pulse} /> : null}
          </span>
          <div><div className={s.tlTitle}>{it.title}</div>{it.subtitle && <div className={s.tlSub}>{it.subtitle}</div>}</div>
        </li>
      ))}
    </ol>
  );
}

export function Avatar({ initials }) {
  return <span className={s.avatar} aria-hidden>{initials}</span>;
}

export function EmptyState({ icon = 'history', title, children }) {
  return (
    <div className={s.empty}>
      <Icon name={icon} size={34} />
      <div className={s.emptyTitle}>{title}</div>
      {children && <div>{children}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return <div className={s.section}><span>{children}</span>{action}</div>;
}

export function Skeleton({ height = 16, width = '100%' }) {
  return <div className={s.skeleton} style={{ height, width }} aria-hidden />;
}
