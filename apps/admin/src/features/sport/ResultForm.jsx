import { useState } from 'react';
import { formatFCFA } from '@wynveo/core';
import { Btn } from '../../ui/index.jsx';

/** Saisie du score final, ou annulation du match (les tickets sont alors remboursés). */
export function ResultForm({ event, onSubmit, onCancel, busy, error }) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [cancel, setCancel] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit(cancel ? { eventId: event.id, cancelled: true } : { eventId: event.id, score: { home: Number(home), away: Number(away) } });
    if (ok) onCancel();
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }} aria-label="Résultat du match">
      <p className="notice">
        {event.betCount} ticket(s) · {formatFCFA(event.totalStake)} misés. Les tickets seront réglés et les gains crédités tout de suite.
        Ce résultat ne pourra plus être modifié.
      </p>
      {!cancel && (
        <div className="score-row">
          <label><span className="label">{event.home}</span><input className="input score" inputMode="numeric" value={home} onChange={(e) => setHome(e.target.value.replace(/\D/g, ''))} aria-label={`Score ${event.home}`} /></label>
          <span className="score-sep">–</span>
          <label><span className="label">{event.away}</span><input className="input score" inputMode="numeric" value={away} onChange={(e) => setAway(e.target.value.replace(/\D/g, ''))} aria-label={`Score ${event.away}`} /></label>
        </div>
      )}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={cancel} onChange={(e) => setCancel(e.target.checked)} />
        <span>Match annulé ou reporté : rembourser les choix sur ce match</span>
      </label>
      {error && <p className="notice bad" role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn onClick={onCancel}>Annuler</Btn>
        <Btn variant={cancel ? 'no' : 'ok'} type="submit" loading={busy} disabled={!cancel && (home === '' || away === '')}>
          {cancel ? 'Annuler le match' : 'Valider le résultat'}
        </Btn>
      </div>
    </form>
  );
}
