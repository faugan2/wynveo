import { Link } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from '@wynveo/core';
import { Button, Checkbox, Notice, PasswordField, TextField } from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { useRegister } from '../../hooks/useRegister.js';
import { useSession } from '../../hooks/SessionProvider.jsx';
import { ROUTES } from '../../app/routes.js';
import s from './auth.module.css';

export function RegisterPage() {
  const form = useRegister();
  const { signOut } = useSession();
  return (
    <>
      <PageHeader title="Inscription" backTo={form.hasAccount ? null : ROUTES.welcome} />
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); form.submit(); }} noValidate>
        {form.hasAccount ? (
          <p className={s.intro}>Compte créé pour le <b style={{ color: '#fff' }}>{form.accountPhone}</b>. Il ne reste que quelques informations.</p>
        ) : (
          <p className={s.intro}>Un seul compte pour les Jeux et le Sport.</p>
        )}

        <TextField
          label="Nom complet" autoComplete="name" placeholder="Ex : Kossi Amouzou"
          value={form.fullName} onChange={(e) => form.setFullName(e.target.value)} error={form.errors.fullName} autoFocus
        />
        {!form.hasAccount && (
          <>
            <TextField
              label="Numéro de téléphone" prefix="🇹🇬 +228" inputMode="tel" autoComplete="username" placeholder="90 12 34 56"
              value={form.phone} onChange={(e) => form.setPhone(e.target.value)} error={form.errors.phone}
              hint="Utilisez votre numéro T-Money ou Flooz : vos retraits y seront envoyés."
            />
            <PasswordField
              label="Mot de passe" autoComplete="new-password"
              value={form.password} onChange={(e) => form.setPassword(e.target.value)} error={form.errors.password}
              hint={`Au moins ${PASSWORD_MIN_LENGTH} caractères, avec des lettres et des chiffres.`}
            />
          </>
        )}
        <TextField
          label="Code parrain" optional placeholder="Ex : KOSSI228" autoCapitalize="characters"
          value={form.referralCode} onChange={(e) => form.setReferralCode(e.target.value)} error={form.errors.referralCode}
        />
        <Checkbox checked={form.ageConfirmed} onChange={form.setAgeConfirmed} error={form.errors.age}>
          J'ai 18 ans ou plus et j'accepte les conditions d'utilisation.
        </Checkbox>
        {form.error && <Notice tone="error">{form.error}</Notice>}
        <Button type="submit" block loading={form.pending}>Créer mon compte</Button>
        {form.hasAccount
          ? <Button variant="link" onClick={signOut}>Utiliser un autre numéro</Button>
          : <p className={s.footer}>Déjà un compte ? <Link to={ROUTES.login}><b>Se connecter</b></Link></p>}
      </form>
    </>
  );
}
