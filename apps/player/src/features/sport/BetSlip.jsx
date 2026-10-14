import { Link } from 'react-router-dom';
import { SLIP_TYPE, SPORT_LIMITS, formatAmount } from '@wynveo/core';
import { Button, Notice, SegmentedControl } from '../../ui/index.js';
import { SlipSelection, SlipTotals, StakeInput, formatOdds } from '../../ui/sport/index.jsx';
import { useBetSlip } from '../../hooks/BetSlipProvider.jsx';
import { ROUTES } from '../../app/routes.js';
import s from './sport.module.css';

const fcfa = (v) => `${formatAmount(v)} FCFA`;

/** Ticket confirmé : références et gain possible. */
function Receipt({ receipt, onClose }) {
  const potential = receipt.tickets.reduce((sum, t) => sum + t.potentialWin, 0);
  return (
    <div className={s.receipt} role="status">
      <div className={s.receiptIcon} aria-hidden>✓</div>
      <h3>Pari validé !</h3>
      <p>{receipt.tickets.length > 1 ? `${receipt.tickets.length} tickets enregistrés.` : `Ticket ${receipt.tickets[0].reference}`}</p>
      {receipt.oddsChanged && <p className={s.receiptNote}>Placé avec les nouvelles cotes.</p>}
      <SlipTotals rows={[
        { label: 'Mise totale', value: fcfa(receipt.totalStake) },
        receipt.type === SLIP_TYPE.COMBO && { label: 'Cote', value: formatOdds(receipt.tickets[0].totalOdds) },
        { label: 'Gain possible', value: fcfa(potential), strong: true },
      ]} />
      <div className={s.receiptActions}>
        <Button variant="ghost" as={Link} to={ROUTES.bets} state={{ product: 'sport' }}>Mes paris</Button>
        <Button variant="blue" onClick={onClose}>Nouveau coupon</Button>
      </div>
    </div>
  );
}

/** Coupon : choix, simple ou combiné, mise et validation. */
export function BetSlip({ onClose }) {
  const slip = useBetSlip();
  const { selections, type, stake, summary } = slip;

  if (slip.receipt) {
    return (
      <div className={s.slip}>
        {onClose && <div className={s.slipHead}><span style={{ flex: 1 }} /><button type="button" className={s.close} onClick={onClose} aria-label="Fermer le coupon">✕</button></div>}
        <Receipt receipt={slip.receipt} onClose={slip.dismissReceipt} />
      </div>
    );
  }

  const closed = selections.some((x) => x.closed);
  return (
    <div className={s.slip}>
      <div className={s.slipHead}>
        <h2>Coupon {summary.count > 0 && <span className={s.badge}>{summary.count}</span>}</h2>
        {summary.count > 0 && <button type="button" className={s.linkBtn} onClick={slip.clear}>Tout effacer</button>}
        {onClose && <button type="button" className={s.close} onClick={onClose} aria-label="Fermer le coupon">✕</button>}
      </div>

      {summary.count === 0 ? (
        <div className={s.slipEmpty}>
          <span aria-hidden>🎫</span>
          <p>Touchez une cote pour l'ajouter à votre coupon.</p>
          <small>Simple : un ticket par choix. Combiné : les cotes se multiplient, tous les choix doivent gagner.</small>
        </div>
      ) : (
        <>
          <SegmentedControl label="Type de coupon" value={type} onChange={slip.setType}
            options={[{ value: SLIP_TYPE.SINGLE, label: `Simple${summary.count > 1 ? ` (${summary.count})` : ''}` }, { value: SLIP_TYPE.COMBO, label: 'Combiné', disabled: !summary.canCombo }]} />
          {type === SLIP_TYPE.COMBO && summary.sameEvent && <Notice tone="warn">Un combiné ne peut contenir qu'un choix par match. Passez en simple ou retirez un choix.</Notice>}

          <ul className={s.selList}>
            {selections.map((x) => <SlipSelection key={`${x.eventId}${x.market}${x.outcome}`} sel={x} onRemove={() => slip.remove(x)} />)}
          </ul>

          <StakeInput value={stake} onChange={slip.setStake} quick={SPORT_LIMITS.quickStakes}
            label={type === SLIP_TYPE.SINGLE && summary.count > 1 ? 'Mise par choix' : 'Mise'} />

          <SlipTotals rows={[
            type === SLIP_TYPE.COMBO && summary.odds && { label: 'Cote totale', value: formatOdds(summary.odds) },
            type === SLIP_TYPE.SINGLE && summary.count > 1 && { label: 'Mise totale', value: fcfa(summary.totalStake) },
            { label: 'Gain possible', value: fcfa(summary.potentialWin), strong: true },
          ]} />

          {slip.error && <Notice tone={slip.oddsChanged ? 'warn' : 'error'}>{slip.error}</Notice>}
          {closed ? (
            <Button variant="orange" block onClick={slip.removeClosed}>Retirer les matchs indisponibles</Button>
          ) : slip.oddsChanged ? (
            <Button variant="orange" block loading={slip.placing} onClick={() => slip.place({ acceptOddsChanges: true })}>
              Accepter les cotes et parier
            </Button>
          ) : (
            <Button variant="green" block loading={slip.placing} disabled={Boolean(summary.problem)} onClick={() => slip.place()}
              sub={summary.problem ?? `Solde : ${fcfa(summary.balance)}`}>
              Parier {fcfa(summary.totalStake)}
            </Button>
          )}
          {summary.problem === 'Solde insuffisant pour cette mise.' && <Button variant="link" as={Link} to={ROUTES.deposit}>Recharger mon compte</Button>}
        </>
      )}
    </div>
  );
}
