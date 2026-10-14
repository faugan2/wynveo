/**
 * Composants visuels du Sport : ils reçoivent des données et renvoient des événements.
 * Aucune règle métier ni accès aux services ici.
 */
import { formatAmount } from '@wynveo/core';
import s from './sport.module.css';

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const formatTime = (d) => TIME.format(new Date(d));
export const formatOdds = (o) => (o ? o.toFixed(2) : '–');

/** Bouton de cote : libellé court + cote. `selected` quand le choix est dans le coupon. */
export function OddsButton({ label, odds, selected, disabled, onClick, wide, title }) {
  return (
    <button type="button" className={`${s.odds} ${selected ? s.oddsOn : ''} ${wide ? s.oddsWide : ''}`}
      disabled={disabled || !odds} aria-pressed={selected} onClick={onClick} title={title}>
      <span className={s.oddsLabel}>{label}</span>
      <b className={s.oddsValue}>{disabled || !odds ? '🔒' : formatOdds(odds)}</b>
    </button>
  );
}

/** Chips de sports avec le nombre de matchs. */
export function SportChips({ options, value, onChange }) {
  return (
    <div className={s.chips} role="tablist" aria-label="Choisir un sport">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value}
          className={`${s.chip} ${value === o.value ? s.chipOn : ''}`} onClick={() => onChange(o.value)}>
          <span aria-hidden>{o.icon}</span>{o.label}{o.count !== undefined && <span className={s.chipCount}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Ligne d'un match : heure, équipes, cotes du résultat.
 * outcomes : [{ key, label, odds, selected }]
 */
export function EventRow({ time, home, away, outcomes, closed, onPick, onOpen, extra, badge }) {
  return (
    <div className={s.event}>
      <button type="button" className={s.eventMain} onClick={onOpen} aria-label={`${home} contre ${away}, voir tous les paris`}>
        <span className={s.eventTime}>{badge ?? time}</span>
        <span className={s.teams}><span>{home}</span><span>{away}</span></span>
        {extra && <span className={s.more}>{extra}</span>}
      </button>
      <div className={s.eventOdds} style={{ '--n': outcomes.length }}>
        {outcomes.map((o) => (
          <OddsButton key={o.key} label={o.label} odds={o.odds} selected={o.selected} disabled={closed} onClick={() => onPick(o.key)} title={o.title} />
        ))}
      </div>
    </div>
  );
}

export function LeagueBlock({ icon, name, children }) {
  return (
    <section className={s.league}>
      <h3 className={s.leagueTitle}><span aria-hidden>{icon}</span>{name}</h3>
      <div className={s.leagueBody}>{children}</div>
    </section>
  );
}

/** Match en direct : score, sans paris (paris avant le coup d'envoi uniquement). */
export function LiveRow({ home, away, score, onOpen, action }) {
  return (
    <div className={s.live}>
      <button type="button" className={s.liveMain} onClick={onOpen}>
        <span className={s.liveDot}>Direct</span>
        <span className={s.liveTeams}><span>{home}</span><span>{away}</span></span>
        <span className={s.liveScore}><b>{score?.home ?? 0}</b><b>{score?.away ?? 0}</b></span>
      </button>
      {action}
    </div>
  );
}

/* ---------------- Coupon ---------------- */

export function SlipSelection({ sel, onRemove }) {
  const moved = sel.previousOdds && sel.previousOdds !== sel.odds;
  return (
    <li className={`${s.sel} ${sel.closed ? s.selClosed : ''}`}>
      <div className={s.selText}>
        <b>{sel.pick}</b>
        <span>{sel.marketLabel}</span>
        <span className={s.selEvent}>{sel.event}</span>
        {sel.closed && <span className={s.selWarn}>Plus disponible</span>}
      </div>
      <div className={s.selRight}>
        <b className={moved ? (sel.odds > sel.previousOdds ? s.up : s.down) : ''}>
          {moved && <del className={s.prev}>{formatOdds(sel.previousOdds)}</del>}{formatOdds(sel.odds)}
        </b>
        <button type="button" className={s.selRemove} onClick={onRemove} aria-label={`Retirer ${sel.pick}`}>✕</button>
      </div>
    </li>
  );
}

export function SlipTotals({ rows }) {
  return (
    <dl className={s.totals}>
      {rows.filter(Boolean).map((r) => (
        <div key={r.label} className={r.strong ? s.totalStrong : ''}><dt>{r.label}</dt><dd>{r.value}</dd></div>
      ))}
    </dl>
  );
}

export function StakeInput({ value, onChange, quick, label = 'Mise' }) {
  return (
    <div className={s.stake}>
      <label className={s.stakeField}>
        <span>{label}</span>
        <input inputMode="numeric" value={value ? formatAmount(value) : ''} placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')))} aria-label="Mise en FCFA" />
        <span className={s.cur}>FCFA</span>
      </label>
      <div className={s.quick}>
        {quick.map((q) => (
          <button key={q} type="button" className={value === q ? s.quickOn : ''} onClick={() => onChange(q)}>{formatAmount(q)}</button>
        ))}
      </div>
    </div>
  );
}

/** Barre fixe en bas de l'écran (mobile) qui ouvre le coupon. */
export function SlipBar({ count, odds, onOpen }) {
  if (!count) return null;
  return (
    <button type="button" className={s.slipBar} onClick={onOpen}>
      <span className={s.slipCount}>{count}</span>
      <span>Mon coupon</span>
      {odds && <b>Cote {formatOdds(odds)}</b>}
      <span aria-hidden>▲</span>
    </button>
  );
}

export { s as sportStyles };
