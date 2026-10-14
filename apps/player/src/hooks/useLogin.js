import { useState } from 'react';
import { normalizeTogoPhone } from '@wynveo/core';
import { authService } from '../services/index.js';
import { useAsyncAction } from './useAsyncAction.js';

/** Connexion : numéro + mot de passe. */
export function useLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const action = useAsyncAction(authService.signIn);

  async function submit() {
    const check = normalizeTogoPhone(phone);
    if (!check.ok) { action.setError(check.message); return; }
    if (!password) { action.setError('Entrez votre mot de passe.'); return; }
    await action.run(check.e164, password);
    // En cas de succès, la session change et le routeur redirige.
  }

  return {
    phone, setPhone: (v) => { setPhone(v); action.clearError(); },
    password, setPassword: (v) => { setPassword(v); action.clearError(); },
    submit, pending: action.pending, error: action.error,
    showHelp, toggleHelp: () => setShowHelp((v) => !v),
  };
}
