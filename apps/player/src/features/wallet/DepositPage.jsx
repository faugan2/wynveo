import { Link } from 'react-router-dom';
import { formatAmount, formatFCFA, OPERATORS, maskPhone } from '@wynveo/core';
import {
  AmountField, Button, Card, ChipGroup, Icon, KeyValueList, Money, Notice, SectionTitle, TextField, Timeline,
} from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { useDepositFlow } from '../../hooks/useDepositFlow.js';
import { ROUTES } from '../../app/routes.js';
import { OperatorPicker } from './components/OperatorPicker.jsx';

export function DepositPage() {
  const flow = useDepositFlow();
  return (
    <>
      <PageHeader title="Dépôt" backTo={ROUTES.wallet} />
      {flow.step === 'form' && <DepositForm flow={flow} />}
      {flow.step === 'awaiting' && <AwaitingConfirmation flow={flow} />}
      {flow.step === 'success' && <DepositSuccess flow={flow} />}
      {flow.step === 'failed' && <DepositFailed flow={flow} />}
    </>
  );
}

function DepositForm({ flow }) {
  const quick = flow.limits.quickAmounts.map((v) => ({ value: v, label: formatAmount(v) }));
  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={(e) => { e.preventDefault(); flow.submit(); }} noValidate>
      <SectionTitle>1. Moyen de paiement</SectionTitle>
      <OperatorPicker value={flow.operator} onChange={flow.setOperator} />

      <SectionTitle>2. Montant</SectionTitle>
      <AmountField label="Montant du dépôt" value={flow.amount} onChange={flow.setAmount} error={flow.errors.amount}
        hint={`Entre ${formatFCFA(flow.limits.min)} et ${formatFCFA(flow.limits.max)}`} />
      <ChipGroup label="Montants rapides" options={quick} value={flow.amount} onChange={flow.setAmount} />

      <TextField
        label={`Numéro ${OPERATORS[flow.operator].name.split(' ')[0]}`} prefix="+228" inputMode="tel" placeholder="90 12 34 56"
        value={flow.msisdn} onChange={(e) => flow.setMsisdn(e.target.value)} error={flow.errors.msisdn}
      />
      {flow.verifiesNumber && (
        <Notice icon="check">Ce dépôt confirme aussi que ce numéro est à vous : il débloque les retraits{flow.bonusEligible ? ' et le bonus de bienvenue' : ''}.</Notice>
      )}
      {!flow.fromOwnNumber && !flow.errors.msisdn && (!flow.phoneVerified || flow.bonusStillAvailable) && flow.msisdn.replace(/\D/g, '').length >= 8 && (
        <Notice tone="warn" icon="info">
          Ce n'est pas le numéro de votre compte ({maskPhone(flow.ownNumber)}). Le dépôt sera crédité, mais
          {flow.phoneVerified ? ' sans bonus de bienvenue.' : ' il ne confirmera pas votre numéro et ne donnera pas le bonus.'}{' '}
          <Button variant="link" onClick={flow.useOwnNumber}>Utiliser mon numéro</Button>
        </Notice>
      )}

      <Card style={{ padding: '6px 14px' }}>
        <KeyValueList rows={[
          { label: 'Frais', value: 'Gratuit', tone: 'good' },
          flow.bonusEligible && { label: `Bonus de bienvenue ${flow.bonusRule.rate * 100} %`, value: `+${formatFCFA(flow.bonusPreview)}`, tone: 'gold' },
        ]} />
      </Card>

      {flow.submitError && <Notice tone="error">{flow.submitError}</Notice>}
      <Button type="submit" block loading={flow.submitting}>Déposer {flow.amount ? formatFCFA(flow.amount) : ''}</Button>
      <Notice icon="phone">Vous allez recevoir une demande de confirmation sur votre téléphone. Validez-la avec votre code secret Mobile Money.</Notice>
    </form>
  );
}

function AwaitingConfirmation({ flow }) {
  return (
    <>
      <Card style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 22 }}>
        <span style={{ width: 70, height: 70, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#f59e0b22', color: 'var(--gold)' }}>
          <Icon name="phone" size={34} />
        </span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', textTransform: 'uppercase' }}>Confirmez sur votre téléphone</h2>
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
          Une demande de <b style={{ color: '#fff' }}>{formatFCFA(flow.amount)}</b> a été envoyée au <b style={{ color: '#fff' }}>{maskPhone(`+228${flow.msisdn}`)}</b>.
          Composez votre code secret pour valider.
        </p>
      </Card>
      <Card>
        <Timeline items={[
          { title: `Demande envoyée à ${OPERATORS[flow.operator].name}`, subtitle: flow.reference, state: 'done' },
          { title: 'Confirmation sur votre téléphone', subtitle: 'En attente…', state: 'current' },
          { title: 'Solde crédité', state: 'todo' },
        ]} />
      </Card>
      {flow.canConfirmManually && (
        <>
          <Notice tone="warn" icon="info">Paiement simulé : aucune demande n'est envoyée à l'opérateur. Utilisez le bouton ci-dessous pour jouer le rôle du téléphone.</Notice>
          {flow.confirmError && <Notice tone="error">{flow.confirmError}</Notice>}
          <Button block onClick={flow.confirmOnPhone} loading={flow.confirming}>Simuler la confirmation</Button>
        </>
      )}
      <Button variant="link" onClick={flow.abandon} disabled={flow.abandoning}>Annuler ce dépôt</Button>
    </>
  );
}

function DepositSuccess({ flow }) {
  return (
    <>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 10px #22b14c33, 0 0 40px #22b14c88' }}>
          <Icon name="check" size={44} strokeWidth={3} />
        </span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginTop: 12 }}>Dépôt réussi</h2>
        <Money value={flow.tx?.amount} size={40} tone="positive" signed />
        {flow.bonus > 0 && <p style={{ color: 'var(--gold)', fontWeight: 700 }}>+ {formatFCFA(flow.bonus)} de bonus de bienvenue</p>}
      </div>
      {flow.numberJustVerified && (
        <Notice icon="check">Votre numéro est confirmé : les retraits sont débloqués.</Notice>
      )}
      <Card style={{ padding: '6px 14px' }}>
        <KeyValueList rows={[
          { label: 'Référence', value: flow.reference },
          { label: 'Opérateur', value: `${OPERATORS[flow.tx?.operator]?.name ?? ''} · ${maskPhone(flow.tx?.msisdn)}` },
          flow.newBalance !== null && { label: 'Solde retirable', value: formatFCFA(flow.newBalance) },
        ]} />
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Button as={Link} to={ROUTES.games} variant="purple">Jeux</Button>
        <Button as={Link} to={ROUTES.sport} variant="teal">Sport</Button>
      </div>
      <Button variant="link" onClick={flow.restart}>Faire un autre dépôt</Button>
    </>
  );
}

function DepositFailed({ flow }) {
  return (
    <>
      <Notice tone="error">{flow.tx?.failureReason ?? "Le dépôt n'a pas abouti."} Aucun montant n'a été débité.</Notice>
      <Button block onClick={flow.restart}>Réessayer</Button>
      <Button as={Link} to={ROUTES.wallet} variant="ghost" block>Retour au portefeuille</Button>
    </>
  );
}
