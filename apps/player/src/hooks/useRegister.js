/**
 * Inscription en un seul écran : numéro + mot de passe (création du compte),
 * puis nom, code parrain et âge (création du profil et du portefeuille).
 * Si le compte existe déjà sans profil (inscription interrompue), seule
 * la seconde partie est demandée.
 */
import { useState } from 'react';
import {
  normalizeTogoPhone, validatePassword, validateFullName, validateReferralCode, formatPhone,
} from '@wynveo/core';
import { authService, profileService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useAsyncAction } from './useAsyncAction.js';

export function useRegister() {
  const { status, user } = useSession();
  const hasAccount = status === 'needsProfile';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [touched, setTouched] = useState(false);

  const action = useAsyncAction(async ({ e164, pw, profile }) => {
    if (!hasAccount) await authService.signUp(e164, pw);
    await profileService.completeProfile(profile);
  });

  const checks = {
    fullName: validateFullName(fullName),
    phone: hasAccount ? { ok: true } : normalizeTogoPhone(phone),
    password: hasAccount ? { ok: true } : validatePassword(password),
    referralCode: validateReferralCode(referralCode),
    age: ageConfirmed ? { ok: true } : { ok: false, message: 'Cochez la case pour confirmer votre âge.' },
  };
  const errors = Object.fromEntries(Object.entries(checks).map(([k, c]) => [k, touched && !c.ok ? c.message : null]));
  const valid = Object.values(checks).every((c) => c.ok);

  async function submit() {
    setTouched(true);
    if (!valid) return;
    await action.run({
      e164: checks.phone.e164,
      pw: password,
      profile: { fullName: checks.fullName.value, referralCode: checks.referralCode.value, ageConfirmed },
    });
    // Le profil apparaît dans la session : le routeur bascule vers l'accueil.
  }

  const edit = (setter) => (v) => { setter(v); action.clearError(); };
  return {
    hasAccount,
    accountPhone: hasAccount ? formatPhone(user?.phone) : null,
    fullName, setFullName: edit(setFullName),
    phone, setPhone: edit(setPhone),
    password, setPassword: edit(setPassword),
    referralCode, setReferralCode: edit(setReferralCode),
    ageConfirmed, setAgeConfirmed: edit(setAgeConfirmed),
    errors, submit, pending: action.pending, error: action.error,
  };
}
