import { useState } from 'react';
import { SPORTS, formatAmount, formatFCFA } from '@wynveo/core';
import { Badge, Btn, Empty, Kpi } from '../../ui/index.jsx';
import { useAdminSession, can } from '../../hooks/AdminSession.jsx';
import { useAdminSportEvents, useSportActions } from '../../hooks/useSportAdmin.js';
import { EventForm } from './EventForm.jsx';
import { ResultForm } from './ResultForm.jsx';

const WHEN = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const STATUS = {
  scheduled: { tone: 'info', label: 'À venir' }, live: { tone: 'bad', label: 'En direct' },
  finished: { tone: 'good', label: 'Terminé' }, cancelled: { tone: 'neutral', label: 'Annulé' },
};
const fmt = (o) => (o ? o.toFixed(2) : '–');

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button type="button" className="btn sm" onClick={onClose} aria-label="Fermer">✕</button></div>
        {children}
      </div>
    </div>
  );
}

function OddsCell({ e }) {
  const h = e.markets.h2h ?? {};
  const t = e.markets.totals;
  return (
    <div className="odds-cell">
      <span>{fmt(h.home)}</span>{SPORTS[e.sport]?.hasDraw && <span>{fmt(h.draw)}</span>}<span>{fmt(h.away)}</span>
      {t && <span className="muted small" style={{ gridColumn: '1 / -1' }}>±{t.line} : {fmt(t.over)} / {fmt(t.under)}</span>}
    </div>
  );
}

/** Matchs & cotes : création, modification, suspension, résultats, import The Odds API. */
export function SportEventsPage() {
  const { admin } = useAdminSession();
  const allowed = can.manageSport(admin.role);
  const [tab, setTab] = useState('open');
  const [modal, setModal] = useState(null); // { kind: 'form'|'result', event }
  const { items, loading, error, stats } = useAdminSportEvents(tab);
  const act = useSportActions();
  const close = () => { setModal(null); act.clearError(); };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginRight: 'auto' }}>Matchs & cotes</h1>
        {allowed && <Btn onClick={act.importNow} loading={act.busy === 'import'}>Importer depuis The Odds API</Btn>}
        {allowed && <Btn variant="primary" onClick={() => { act.clear(); setModal({ kind: 'form', event: null }); }}>+ Nouveau match</Btn>}
      </div>
      {!allowed && <p className="notice">Lecture seule : seuls les rôles Super admin et Trader sport peuvent modifier les matchs.</p>}
      {act.info && !modal && <p className="notice" role="status">{act.info}</p>}
      {act.error && !modal && <p className="notice bad" role="alert">{act.error}</p>}
      {error && <p className="notice bad" role="alert">{error}</p>}

      <div className="kpis">
        <Kpi label={tab === 'open' ? 'Matchs ouverts' : 'Matchs terminés'} value={stats.count} />
        <Kpi label="Tickets" value={formatAmount(stats.bets)} />
        <Kpi label="Mises engagées" value={formatFCFA(stats.stake)} />
        {tab === 'open' && <Kpi label="Suspendus" value={stats.suspended} tone={stats.suspended ? 'warn' : undefined} />}
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>À venir & en direct</button>
        <button type="button" role="tab" aria-selected={tab === 'closed'} className={tab === 'closed' ? 'on' : ''} onClick={() => setTab('closed')}>Terminés</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <p className="muted" style={{ padding: 20 }}>Chargement…</p> : !items.length ? <Empty>Aucun match ici.</Empty> : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Début</th><th>Match</th><th>Cotes 1 · N · 2</th><th className="num">Tickets</th><th className="num">Misé</th><th>État</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((e) => {
                  const st = STATUS[e.status];
                  const open = ['scheduled', 'live'].includes(e.status);
                  return (
                    <tr key={e.id}>
                      <td className="small" style={{ whiteSpace: 'nowrap' }}>{WHEN.format(e.startAt)}</td>
                      <td style={{ minWidth: 200 }}>
                        <b>{e.home} – {e.away}</b>
                        <div className="small muted">{SPORTS[e.sport]?.icon} {e.league} · {e.source === 'odds_api' ? (e.manualOdds ? 'API, cotes modifiées' : 'The Odds API') : 'Saisie manuelle'}</div>
                      </td>
                      <td><OddsCell e={e} /></td>
                      <td className="num">{e.betCount}</td>
                      <td className="num">{formatAmount(e.totalStake)}{e.status === 'finished' && <div className="small muted">payé {formatAmount(e.paidOut)}</div>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <Badge tone={st.tone}>{st.label}</Badge>
                          {e.suspended && open && <Badge tone="warn">Suspendu</Badge>}
                        </div>
                        {e.score && <div style={{ fontWeight: 800, marginTop: 4 }}>{e.score.home} – {e.score.away}</div>}
                      </td>
                      <td>
                        {allowed && open && (
                          <div className="actions">
                            {e.status === 'scheduled' && <Btn size="sm" onClick={() => { act.clear(); setModal({ kind: 'form', event: e }); }}>Modifier</Btn>}
                            {e.status === 'scheduled' && (
                              <Btn size="sm" loading={act.busy === `susp-${e.id}`} onClick={() => act.suspend(e.id, !e.suspended)}>{e.suspended ? 'Reprendre' : 'Suspendre'}</Btn>
                            )}
                            <Btn size="sm" variant="primary" onClick={() => { act.clear(); setModal({ kind: 'result', event: e }); }}>Résultat</Btn>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.kind === 'form' && (
        <Modal title={modal.event ? 'Modifier le match' : 'Nouveau match'} onClose={close}>
          <EventForm event={modal.event} onSubmit={act.save} onCancel={close} busy={act.busy === 'save'} error={act.error} />
        </Modal>
      )}
      {modal?.kind === 'result' && (
        <Modal title={`Résultat : ${modal.event.home} – ${modal.event.away}`} onClose={close}>
          <ResultForm event={modal.event} onSubmit={act.result} onCancel={close} busy={act.busy === 'result'} error={act.error} />
        </Modal>
      )}
    </>
  );
}
