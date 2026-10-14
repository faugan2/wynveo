/**
 * Connexion par SMS en deux étapes : numéro, puis code à 6 chiffres.
 * La même procédure sert à l'inscription et à la connexion.
 */
import { useRef, useState } from 'react';
import { normalizeTogoPhone, formatPhone } from '@wynveo/core';
import { authService } from '../services/index.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useCountdown } from './useCountdown.js';

const RESEND_DELAY = 45;
export const CODE_LENGTH = 6;

export function usePhoneLogin() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [e164, setE164] = useState(null);
  const session = useRef(null);
  const countdown = useCountdown(0);
  const send = useAsyncAction(authService.startPhoneSignIn);
  const confirm = useAsyncAction((c) => session.current.confirm(c));

  async function submitPhone() {
    const check = normalizeTogoPhone(phone);
    if (!check.ok) { send.setError(check.message); return; }
    const s = await send.run(check.e164);
    if (!s) return;
    session.current = s;
    setE164(check.e164);
    setCode('');
    setStep('code');
    countdown.restart(RESEND_DELAY);
  }

  async function submitCode(value = code) {
    if (value.length !== CODE_LENGTH) { confirm.setError(`Le code contient ${CODE_LENGTH} chiffres.`); return; }
    await confirm.run(value);
    // En cas de succès, la session change et le routeur redirige tout seul.
  }

  function changeCode(value) {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    confirm.clearError();
    if (digits.length === CODE_LENGTH) submitCode(digits);
  }

  return {
    step,
    phone,
    setPhone: (v) => { setPhone(v); send.clearError(); },
    code,
    changeCode,
    displayPhone: e164 ? formatPhone(e164) : '',
    submitPhone,
    submitCode: () => submitCode(),
    resend: submitPhone,
    canResend: countdown.done,
    resendIn: countdown.label,
    editPhone: () => { setStep('phone'); setCode(''); confirm.clearError(); },
    sending: send.pending,
    confirming: confirm.pending,
    error: step === 'phone' ? send.error : confirm.error || send.error,
  };
}
