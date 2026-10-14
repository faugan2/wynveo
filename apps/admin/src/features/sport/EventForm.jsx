import { SPORTS } from '@wynveo/core';
import { Btn } from '../../ui/index.jsx';
import { useEventForm } from '../../hooks/useSportAdmin.js';

const pct = (m) => (m === null ? '–' : `${(m * 100).toFixed(1)} %`);
const marginTone = (m) => (m === null ? 'muted' : m < 0 ? 'error' : m < 0.03 ? 'warn-text' : 'muted');

function Field({ label, children, style }) {
  return <label style={style}><span className="label">{label}</span>{children}</label>;
}

/** Création ou modification d'un match et de ses cotes. onSubmit(payload) renvoie vrai si c'est enregistré. */
export function EventForm({ event, onSubmit, onCancel, busy, error }) {
  const f = useEventForm(event);
  const v = f.values;
  const submit = async (e) => {
    e.preventDefault();
    if (await onSubmit(f.payload())) onCancel();
  };
  return (
    <form onSubmit={submit} className="form-grid" aria-label={f.isEdit ? 'Modifier le match' : 'Nouveau match'}>
      <Field label="Sport">
        <select className="input" value={v.sport} onChange={f.set('sport')} disabled={f.isEdit}>
          {Object.values(SPORTS).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
        </select>
      </Field>
      <Field label="Compétition"><input className="input" value={v.league} onChange={f.set('league')} placeholder="Togo D1" /></Field>
      <Field label="Équipe à domicile (1)"><input className="input" value={v.home} onChange={f.set('home')} /></Field>
      <Field label="Équipe à l'extérieur (2)"><input className="input" value={v.away} onChange={f.set('away')} /></Field>
      <Field label="Coup d'envoi (heure de Lomé)" style={{ gridColumn: '1 / -1' }}>
        <input className="input" type="datetime-local" value={v.startAt} onChange={f.set('startAt')} />
      </Field>

      <fieldset className="odds-set">
        <legend>Résultat du match <span className={`small ${marginTone(f.margins.h2h)}`}>· marge {pct(f.margins.h2h)}</span></legend>
        <Field label="1"><input className="input" inputMode="decimal" value={v.h2hHome} onChange={f.set('h2hHome')} aria-label="Cote 1" /></Field>
        {f.hasDraw && <Field label="N"><input className="input" inputMode="decimal" value={v.h2hDraw} onChange={f.set('h2hDraw')} aria-label="Cote N" /></Field>}
        <Field label="2"><input className="input" inputMode="decimal" value={v.h2hAway} onChange={f.set('h2hAway')} aria-label="Cote 2" /></Field>
      </fieldset>

      <fieldset className="odds-set">
        <legend>{SPORTS[v.sport].totalsLabel} (facultatif) <span className={`small ${marginTone(f.margins.totals)}`}>· marge {pct(f.margins.totals)}</span></legend>
        <Field label="Ligne"><input className="input" inputMode="decimal" value={v.totalsLine} onChange={f.set('totalsLine')} aria-label="Ligne du total" /></Field>
        <Field label="Plus de"><input className="input" inputMode="decimal" value={v.over} onChange={f.set('over')} aria-label="Cote plus de" /></Field>
        <Field label="Moins de"><input className="input" inputMode="decimal" value={v.under} onChange={f.set('under')} aria-label="Cote moins de" /></Field>
      </fieldset>

      <p className="small muted" style={{ gridColumn: '1 / -1' }}>
        Une marge négative fait perdre de l'argent à coup sûr. Les cotes saisies ici ne seront plus écrasées par l'import automatique.
      </p>
      {error && <p className="notice bad" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn onClick={onCancel}>Annuler</Btn>
        <Btn variant="primary" type="submit" loading={busy}>{f.isEdit ? 'Enregistrer' : 'Créer le match'}</Btn>
      </div>
    </form>
  );
}
