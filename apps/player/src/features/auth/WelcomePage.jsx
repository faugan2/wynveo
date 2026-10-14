import { Link } from 'react-router-dom';
import { Brand, Button } from '../../ui/index.js';
import { ROUTES } from '../../app/routes.js';
import s from './auth.module.css';

export function WelcomePage() {
  return (
    <div className={s.welcome}>
      <div className={s.center}><Brand size={34} /></div>
      <div className={s.previews} aria-hidden>
        <div className={`${s.preview} ${s.games}`}><span className={s.art}>🎰</span><b>Jeux</b><small>Spin, Box, Jackpot…</small></div>
        <div className={`${s.preview} ${s.sport}`}><span className={s.art}>⚽</span><b>Sport</b><small>Foot, basket, live</small></div>
      </div>
      <div className={s.center}>
        <h1 className={s.headline}>Jeux et paris sportifs, un seul compte</h1>
        <p className={s.lead}>Déposez une fois avec T-Money ou Flooz, jouez partout, retirez vos gains en quelques minutes.</p>
      </div>
      <div className={s.actions}>
        <Button as={Link} to={`${ROUTES.login}?nouveau=1`} block>Créer un compte</Button>
        <Button as={Link} to={ROUTES.login} variant="ghost" block>Se connecter</Button>
        <p className={s.legal}>18+ · Jouez de manière responsable</p>
      </div>
    </div>
  );
}
