import { useNavigate } from 'react-router-dom';
import { MARKET, SPORTS, marketOutcomes } from '@wynveo/core';
import { Card, EmptyState, Notice, Skeleton } from '../../ui/index.js';
import { EventRow, LeagueBlock, LiveRow, SportChips, formatTime } from '../../ui/sport/index.jsx';
import { useSportEvents } from '../../hooks/useSportEvents.js';
import { useBetSlip, selectionFor, shortLabel } from '../../hooks/BetSlipProvider.jsx';
import { sportService } from '../../services/index.js';
import { ROUTES } from '../../app/routes.js';
import s from './sport.module.css';

/** Liste des matchs : chips de sport, matchs en direct, puis matchs à venir par jour et compétition. */
export function EventsView({ sport, onSport }) {
  const { loading, error, days, live, counts } = useSportEvents({ sport });
  const slip = useBetSlip();
  const navigate = useNavigate();
  const open = (id) => navigate(`${ROUTES.sport}/match/${id}`);

  const chips = [
    { value: 'all', label: 'Tous', icon: '🏟️', count: counts.all ?? 0 },
    ...Object.values(SPORTS).map((sp) => ({ value: sp.id, label: sp.label, icon: sp.icon, count: counts[sp.id] ?? 0 })),
  ];

  return (
    <div className={s.list}>
      <div className={s.hero}>
        <div>
          <h1>Paris sportifs</h1>
          <p>Pariez avant le coup d'envoi. Même solde que les jeux.</p>
        </div>
      </div>
      <SportChips options={chips} value={sport} onChange={onSport} />
      {error && <Notice tone="error">{error}</Notice>}
      {loading && <Card style={{ display: 'grid', gap: 10 }}><Skeleton height={52} /><Skeleton height={52} /><Skeleton height={52} /></Card>}

      {live.length > 0 && (
        <LeagueBlock icon="🔴" name="En direct">
          {live.map((e) => (
            <LiveRow key={e.id} home={e.home} away={e.away} score={e.score} onOpen={() => open(e.id)}
              action={sportService.demo && (
                <button type="button" className={s.demoBtn} onClick={() => sportService.demo.finishEvent(e.id)}>Démo : terminer</button>
              )} />
          ))}
        </LeagueBlock>
      )}

      {!loading && days.length === 0 && (
        <Card><EmptyState icon="sport" title="Aucun match pour le moment">Les prochains matchs apparaîtront ici dès que les cotes seront publiées.</EmptyState></Card>
      )}

      {days.map((day) => (
        <section key={day.label} className={s.day}>
          <h2 className={s.dayTitle}>{day.label}</h2>
          {day.leagues.map((lg) => (
            <LeagueBlock key={`${lg.sport}${lg.name}`} icon={SPORTS[lg.sport]?.icon} name={lg.name}>
              {lg.events.map((e) => (
                <EventRow key={e.id} time={formatTime(e.startAt)} home={e.home} away={e.away}
                  closed={!e.open} badge={!e.open ? 'Fermé' : undefined}
                  extra={e.markets.totals ? '+1 pari' : null}
                  onOpen={() => open(e.id)}
                  outcomes={marketOutcomes(e, MARKET.H2H).map((o) => {
                    const sel = selectionFor(e, MARKET.H2H, o);
                    return { key: o, label: shortLabel(e, MARKET.H2H, o), odds: sel.odds, selected: slip.has(sel), title: sel.pick };
                  })}
                  onPick={(o) => slip.toggle(selectionFor(e, MARKET.H2H, o))} />
              ))}
            </LeagueBlock>
          ))}
        </section>
      ))}
    </div>
  );
}
