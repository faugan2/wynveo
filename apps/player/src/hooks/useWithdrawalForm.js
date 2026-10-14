import { useState } from 'react';
import {
  WITHDRAWAL_LIMITS, validateWithdrawal, withdrawableAmount, guessOperator, maskPhone, dayKey, TX_STATUS,
} from '@wynveo/core';
import { walletService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useAsyncAction } from './useAsyncAction.js';

/** Formulaire de retrait. L'argent part toujours vers le numéro du compte. */
export function useWithdrawalForm() {
  const { profile, wallet } = useSession();
  const [operator, setOperator] = useState(() => guessOperator(profile?.phone) ?? 'TMONEY');
  const [amount, setAmount] = useState(null);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState(null);
  const action = useAsyncAction(walletService.requestWithdrawal);

  const available = withdrawableAmount(wallet);
  const check = validateWithdrawal({ amount, wallet, kycStatus: profile?.kycStatus, today: dayKey() });

  async function submit() {
    setTouched(true);
    if (!check.ok) return;
    const res = await action.run({ amount, operator });
    if (res) setResult(res);
  }

  const outcome = !result ? null
    : result.status === TX_STATUS.SUCCESS ? 'paid'
      : result.status === TX_STATUS.PENDING_REVIEW ? 'review'
        : result.status === TX_STATUS.FAILED ? 'failed' : 'processing';

  return {
    limits: WITHDRAWAL_LIMITS,
    available,
    bonusBalance: wallet?.bonusBalance ?? 0,
    kycStatus: profile?.kycStatus,
    destination: maskPhone(profile?.phone),
    operator, setOperator,
    amount, setAmount: (v) => { setAmount(v); action.clearError(); },
    setAll: () => setAmount(Math.min(available, WITHDRAWAL_LIMITS.max)),
    error: touched && !check.ok ? check.message : action.error,
    errorCode: touched && !check.ok ? check.code : null,
    submit, pending: action.pending,
    result, outcome,
    reset: () => { setResult(null); setAmount(null); setTouched(false); },
  };
}
