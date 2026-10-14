import s from './HubCard.module.css';
import { Icon } from './Icon.jsx';

/** Grande carte d'entrée vers une application (Jeux ou Sport). tone : games | sport */
export function HubCard({ as: As = 'a', tone, art, title, text, badge, ...rest }) {
  return (
    <As className={`${s.card} ${s[tone]}`} {...rest}>
      {badge && <span className={s.badge}>{badge}</span>}
      <span className={s.art} aria-hidden>{art}</span>
      <span className={s.title}>{title}</span>
      <span className={s.text}>{text}</span>
      <span className={s.go} aria-hidden><Icon name="chevron" /></span>
    </As>
  );
}
