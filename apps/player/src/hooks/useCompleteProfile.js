import { useState } from 'react';
import { validateFullName, validateReferralCode } from '@wynveo/core';
import { profileService } from '../services/index.js';
import { useAsyncAction } from './useAsyncAction.js';

/** Formulaire de fin d'inscription : nom, code parrain, âge. */
export function useCompleteProfile() {
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [touched, setTouched] = useState(false);
  const action = useAsyncAction(profileService.completeProfile);

  const nameCheck = validateFullName(fullName);
  const refCheck = validateReferralCode(referralCode);
  const errors = {
    fullName: touched && !nameCheck.ok ? nameCheck.message : null,
    referralCode: touched && !refCheck.ok ? refCheck.message : null,
    age: touched && !ageConfirmed ? 'Cochez la case pour confirmer votre âge.' : null,
  };
  const valid = nameCheck.ok && refCheck.ok && ageConfirmed;

  async function submit() {
    setTouched(true);
    if (!valid) return;
    await action.run({ fullName: nameCheck.value, referralCode: refCheck.value, ageConfirmed });
    // Le profil apparaît dans la session : le routeur bascule vers l'accueil.
  }

  return {
    fullName, setFullName, referralCode, setReferralCode, ageConfirmed, setAgeConfirmed,
    errors, submit, pending: action.pending, error: action.error,
  };
}
