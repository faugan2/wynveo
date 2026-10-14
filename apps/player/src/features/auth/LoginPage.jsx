import { Link } from 'react-router-dom';
import { Button, Notice, PasswordField, TextField } from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { useLogin } from '../../hooks/useLogin.js';
import { ROUTES } from '../../app/routes.js';
import s from './auth.module.css';

export function LoginPage() {
  const login = useLogin();
  return (
    <>
      <PageHeader title="Connexion" backTo={ROUTES.welcome} />
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); login.submit(); }} noValidate>
        <p className={s.intro}>Heureux de vous revoir. Entrez votre numéro et votre mot de passe.</p>
        <TextField
          label="Numéro de téléphone" prefix="🇹🇬 +228" inputMode="tel" autoComplete="username"
          placeholder="90 12 34 56" value={login.phone} onChange={(e) => login.setPhone(e.target.value)} autoFocus
        />
        <PasswordField
          label="Mot de passe" autoComplete="current-password"
          value={login.password} onChange={(e) => login.setPassword(e.target.value)}
        />
        {login.error && <Notice tone="error">{login.error}</Notice>}
        <Button type="submit" block loading={login.pending}>Se connecter</Button>
        <Button variant="link" onClick={login.toggleHelp} aria-expanded={login.showHelp}>Mot de passe oublié ?</Button>
        {login.showHelp && (
          <Notice icon="info">
            Contactez le support Wynveo depuis le numéro de votre compte : nous vérifions votre identité puis
            réinitialisons votre mot de passe.
          </Notice>
        )}
        <p className={s.footer}>Pas encore de compte ? <Link to={ROUTES.register}><b>Créer un compte</b></Link></p>
      </form>
    </>
  );
}
