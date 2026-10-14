import { Link, useParams } from 'react-router-dom';
import { EVENT_STATUS, MARKET, SPORTS, marketLabel, marketOutcomes } from '@wynveo/core';
import { Card, EmptyState, Notice, Skeleton } from '../../ui/index.js';
import { OddsButton, formatTime } from '../../ui/sport/index.jsx';
import { useSportEvent, dayLabel } from '../../hooks/useSportEvents.js';
import { useBetSlip, selectionFor } from '../../hooks/BetSlipProvider.jsx';
import { sportService } from '../../services/index.js';
import { ROUTES } from '../../app/routes.js';
import s from './sport.module.css';

/** Détail d'un match : tous les marchés proposés. */
export function MatchView() {
  const { id } = useParams();
  const { loading, event } = useSportEvent(id);
  const slip = useBetSlip();

  if (loading) return <Card style={{ display: 'grid', gap: 10 }}><Skeleton height={90} /><Skeleton height={60} /></Card>;
  if (!event) return <Card><EmptyState icon="sport" title="Match introuvable"><Link to={ROUTES.sport}>Retour aux matchs</Link></EmptyState></Card>;

  const sport = SPORTS[event.sport];
  const finished = [EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED].includes(event.status);
  const markets = [MARKET.H2H, MARKET.TOTALS].filter((m) => event.markets?.[m]);

  return (
    <div className={s.list}>
      <Link to={ROUTES.sport} className={s.back}>← Tous les matchs</Link>
      <div className={s.matchHead}>
        <div className={s.matchLeague}>{sport?.icon} {event.league}</div>
        <div className={s.matchTeams}>
          <b>{event.home}</b>
          <span className={s.matchCenter}>
            {event.score ? <span className={s.matchScore}>{event.score.home} – {event.score.away}</span> : <span className={s.vs}>VS</span>}
          </span>
          <b>{event.away}</b>
        </div>
        <div className={s.matchWhen}>
          {event.status === EVENT_STATUS.LIVE ? <span className={s.liveTag}>En direct</span>
            : event.status === EVENT_STATUS.FINISHED ? 'Terminé'
              : event.status === EVENT_STATUS.CANCELLED ? 'Annulé'
                : `${dayLabel(event.startAt)} · ${formatTime(event.startAt)}`}
        </div>
      </div>

      {!event.open && !finished && <Notice tone="info">Les paris sont fermés pour ce match : ils se font avant le coup d'envoi.</Notice>}
      {event.open && event.suspended && <Notice tone="warn">Paris suspendus momentanément.</Notice>}

      {markets.map((m) => (
        <section key={m} className={s.market}>
          <h3>{marketLabel(event.sport, m)}{m === MARKET.TOTALS && <small> · ligne {event.markets.totals.line}</small>}</h3>
          <div className={s.marketGrid} style={{ '--n': marketOutcomes(event, m).length }}>
            {marketOutcomes(event, m).map((o) => {
              const sel = selectionFor(event, m, o);
              return <OddsButton key={o} wide label={sel.pick} odds={sel.odds} selected={slip.has(sel)} disabled={!event.open} onClick={() => slip.toggle(sel)} />;
            })}
          </div>
        </section>
      ))}

      {sportService.demo && !finished && (
        <div className={s.demoBox}>
          <span>Démo</span>
          <button type="button" className={s.demoBtn} onClick={() => sportService.demo.moveOdds(event.id)}>Faire baisser la cote « 1 »</button>
          <button type="button" className={s.demoBtn} onClick={() => sportService.demo.finishEvent(event.id)}>Terminer le match</button>
        </div>
      )}
    </div>
  );
}
