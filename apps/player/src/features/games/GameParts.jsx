import s from './games.module.css';

/** En-tête commun : "1. LUCKY SPIN" + accroche. */
export function GameHead({ number, title, id, children }) {
  return (
    <div className={s.head}>
      <h2 id={id}>{number}. {title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function Features({ items }) {
  return <ul className={s.feats}>{items.map(([icon, text]) => <li key={text}><span aria-hidden>{icon}</span>{text}</li>)}</ul>;
}
