import s from './Card.module.css';

/** Surface encadrée. tone : default | glow | gold | hero | success | teal ; flush = liste sans marge. */
export function Card({ as: As = 'div', tone, flush, className = '', children, ...rest }) {
  const cls = [s.card, tone && s[tone], flush && s.flush, className].filter(Boolean).join(' ');
  return <As className={cls} {...rest}>{children}</As>;
}
