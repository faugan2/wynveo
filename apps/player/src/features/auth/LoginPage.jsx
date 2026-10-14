import { useSearchParams } from 'react-router-dom';
import { Button, Icon, OtpInput, TextField } from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { usePhoneLogin, CODE_LENGTH } from '../../hooks/usePhoneLogin.js';
import { ROUTES } from '../../app/routes.js';
import s from './auth.module.css';

/** Connexion et inscription : même procédure par SMS, seul le titre change. */
export function LoginPage() {
  const [params] = useSearchParams();
  const isSignup = params.has('nouveau');
  const login = usePhoneLogin();

  if (login.step === 'code') {
    return (
      <>
        <PageHeader title="Vérification" backTo={null} />
        <form className={s.form} onSubmit={(e) => { e.preventDefault(); login.submitCode(); }}>
          {isSignup && <Progress step={1} />}
          <div className={s.codeHead}>
            <span className={s.codeIcon}><Icon name="phone" size={30} /></span>
            <h2 className={s.codeTitle}>Entrez le code reçu</h2>
            <p className={s.intro}>Code à {CODE_LENGTH} chiffres envoyé par SMS au<br /><b style={{ color: '#fff' }}>{login.displayPhone}</b></p>
          </div>
          <OtpInput length={CODE_LENGTH} value={login.code} onChange={login.changeCode} invalid={Boolean(login.error)} autoFocus />
          {login.error && <p className={s.error} role="alert">{login.error}</p>}
          <p className={s.resend}>
            {login.canResend
              ? <Button variant="link" onClick={login.resend} loading={login.sending}>Renvoyer le code</Button>
              : <>Renvoyer le code dans <b>{login.resendIn}</b></>}
          </p>
          <Button type="submit" block loading={login.confirming}>Valider</Button>
          <Button variant="link" onClick={login.editPhone}>Modifier le numéro</Button>
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader title={isSignup ? 'Inscription' : 'Connexion'} backTo={ROUTES.welcome} />
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); login.submitPhone(); }}>
        {isSignup && <Progress step={0} />}
        <p className={s.intro}>
          {isSignup
            ? 'Entrez votre numéro : nous vous envoyons un code par SMS pour créer votre compte.'
            : 'Entrez votre numéro : nous vous envoyons un code par SMS.'}
        </p>
        <TextField
          label="Numéro de téléphone"
          prefix="🇹🇬 +228"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="90 12 34 56"
          value={login.phone}
          onChange={(e) => login.setPhone(e.target.value)}
          error={login.error}
          autoFocus
        />
        <Button type="submit" block loading={login.sending}>Recevoir le code</Button>
        <p className={s.legal}>En continuant, vous confirmez avoir 18 ans ou plus.</p>
      </form>
    </>
  );
}

function Progress({ step }) {
  return (
    <div>
      <div className={s.stepLabel}>ÉTAPE {step + 1} SUR 3</div>
      <div className={s.progress}><i style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
    </div>
  );
}
