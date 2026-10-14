import { Link } from 'react-router-dom';
import { formatAmount, formatFCFA } from '@wynveo/core';
import { AmountField, Button, Card, ChipGroup, Icon, KeyValueList, Money, Notice, Pill, SectionTitle } from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { useWithdrawalForm } from '../../hooks/useWithdrawalForm.js';
import { ROUTES } from '../../app/routes.js';
import { OperatorPicker } from './components/OperatorPicker.jsx';

const OUTCOME = {
  paid: { icon: 'check', color: 'var(--green)', title: 'Retrait envoyé', text: "L'argent arrive sur votre téléphone dans quelques minutes." },
  processing: { icon: 'clock', color: 'var(--blue)', title: 'Retrait en cours', text: "L'opérateur traite votre retrait." },
  review: { icon: 'clock', color: 'var(--gold-2)', title: 'Retrait en validation', text: 'Notre équipe vérifie ce retrait, en général en moins de 30 minutes. Le montant est mis de côté.' },
  failed: { icon: 'close', color: 'var(--red)', title: 'Retrait échoué', text: "L'opérateur a refusé l'envoi. Le montant a été remis sur votre solde." },
};

export function WithdrawPage() {
  const form = useWithdrawalForm();
  if (form.outcome) return <WithdrawResult form={form} />;

  const quick = [...form.limits.quickAmounts.map((v) => ({ value: v, label: formatAmount(v) }))];
  return (
    <>
      <PageHeader title="Retrait" backTo={ROUTES.wallet} />
      <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={(e) => { e.preventDefault(); form.submit(); }} noValidate>
        <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--fg-muted)' }}>MONTANT RETIRABLE</div>
            <Money value={form.available} size={30} />
          </div>
          <Pill>Min. {formatAmount(form.limits.min)}</Pill>
        </Card>
        {form.bonusBalance > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--fg-dim)' }}>Votre bonus de {formatFCFA(form.bonusBalance)} n'est pas retirable tant qu'il n'a pas été misé.</p>
        )}

        <SectionTitle>Vers</SectionTitle>
        <OperatorPicker value={form.operator} onChange={form.setOperator}
          subtitles={{ TMONEY: form.destination, FLOOZ: form.destination }} />

        <SectionTitle>Montant</SectionTitle>
        <AmountField label="Montant du retrait" value={form.amount} onChange={form.setAmount} error={form.error} />
        <ChipGroup label="Montants rapides" columns={4}
          options={[...quick, { value: 'all', label: 'Tout' }]}
          value={form.amount} onChange={(v) => (v === 'all' ? form.setAll() : form.setAmount(v))} />

        <Card style={{ padding: '6px 14px' }}>
          <KeyValueList rows={[
            { label: 'Frais', value: '0 FCFA' },
            { label: 'Vous recevez', value: formatFCFA(form.amount ?? 0), tone: 'good' },
            { label: 'Délai', value: 'moins de 15 min' },
          ]} />
        </Card>

        <Button type="submit" block loading={form.pending}>Retirer {form.amount ? formatFCFA(form.amount) : ''}</Button>
        {form.errorCode === 'KYC_REQUIRED' || form.kycStatus !== 'verified'
          ? <Notice tone="warn" icon="id">Au-delà de {formatFCFA(form.limits.dailyWithoutKyc)} par jour, une vérification d'identité est demandée.</Notice>
          : null}
      </form>
    </>
  );
}

function WithdrawResult({ form }) {
  const o = OUTCOME[form.outcome];
  return (
    <>
      <PageHeader title="Retrait" backTo={ROUTES.wallet} />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ width: 80, height: 80, borderRadius: '50%', background: o.color, display: 'grid', placeItems: 'center' }}>
          <Icon name={o.icon} size={40} strokeWidth={3} />
        </span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginTop: 10 }}>{o.title}</h2>
        <p style={{ color: 'var(--fg-muted)' }}>{o.text}</p>
      </div>
      <Card style={{ padding: '6px 14px' }}>
        <KeyValueList rows={[
          { label: 'Référence', value: form.result.reference },
          { label: 'Montant', value: formatFCFA(form.amount) },
          { label: 'Vers', value: form.destination },
        ]} />
      </Card>
      <Button as={Link} to={ROUTES.history} variant="ghost" block>Voir l'historique</Button>
      <Button variant="link" onClick={form.reset}>Faire un autre retrait</Button>
    </>
  );
}
