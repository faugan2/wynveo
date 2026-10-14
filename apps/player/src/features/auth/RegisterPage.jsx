import { Button, Checkbox, Notice, TextField } from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { useCompleteProfile } from '../../hooks/useCompleteProfile.js';
import { useSession } from '../../hooks/SessionProvider.jsx';
import { formatPhone } from '@wynveo/core';
import s from './auth.module.css';

/** Dernière étape de l'inscription, après la vérification du numéro. */
export function RegisterPage() {
  const { user, signOut } = useSession();
  const form = useCompleteProfile();

  return (
    <>
      <PageHeader title="Inscription" backTo={null} />
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); form.submit(); }} noValidate>
        <div>
          <div className={s.stepLabel}>ÉTAPE 3 SUR 3</div>
          <div className={s.progress}><i style={{ width: '100%' }} /></div>
        </div>
        <p className={s.intro}>Numéro vérifié : <b style={{ color: '#fff' }}>{formatPhone(user?.phone)}</b>. Il ne reste que votre nom.</p>
        <TextField
          label="Nom complet" autoComplete="name" placeholder="Ex : Kossi Amouzou"
          value={form.fullName} onChange={(e) => form.setFullName(e.target.value)} error={form.errors.fullName} autoFocus
        />
        <TextField
          label="Code parrain" optional placeholder="Ex : KOSSI228" autoCapitalize="characters"
          value={form.referralCode} onChange={(e) => form.setReferralCode(e.target.value)} error={form.errors.referralCode}
        />
        <Checkbox checked={form.ageConfirmed} onChange={form.setAgeConfirmed} error={form.errors.age}>
          J'ai 18 ans ou plus et j'accepte les conditions d'utilisation.
        </Checkbox>
        {form.error && <Notice tone="error">{form.error}</Notice>}
        <Button type="submit" block loading={form.pending}>Créer mon compte</Button>
        <Button variant="link" onClick={signOut}>Ce n'est pas mon numéro</Button>
      </form>
    </>
  );
}
