/**
 * Parcours de dépôt :
 *  'form'     -> le joueur choisit l'opérateur, le montant et le numéro
 *  'awaiting' -> l'opérateur attend la confirmation sur le téléphone
 *  'success' | 'failed'
 */
import { useEffect, useState } from 'react';
import {
  DEPOSIT_LIMITS, validateDepositAmount, normalizeTogoPhone, guessOperator, localDigits, computeWelcomeBonus,
  TX_STATUS, WELCOME_BONUS,
} from '@wynveo/core';
import { walletService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useAsyncAction } from './useAsyncAction.js';

export function useDepositFlow() {
  const { profile, wallet } = useSession();
  const [step, setStep] = useState('form');
  const [operator, setOperator] = useState(() => guessOperator(profile?.phone) ?? 'TMONEY');
  const [amount, setAmount] = useState(5000);
  const [msisdn, setMsisdn] = useState(() => localDigits(profile?.phone));
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(null); // { txId, reference, allowsManualConfirmation, firstDeposit }
  const [tx, setTx] = useState(null);
  const [bonus, setBonus] = useState(0);

  const create = useAsyncAction(walletService.createDeposit);
  const confirm = useAsyncAction(walletService.confirmSimulatedDeposit);
  const cancel = useAsyncAction(walletService.cancelDeposit);

  const amountCheck = validateDepositAmount(amount);
  const phoneCheck = normalizeTogoPhone(msisdn);
  const isFirstDeposit = (wallet?.depositCount ?? 0) === 0;
  const bonusPreview = computeWelcomeBonus(amountCheck.ok ? amount : 0, isFirstDeposit).amount;

  // Suit l'opération pour réagir à la confirmation de l'opérateur (webhook en production).
  useEffect(() => {
    if (!pending) return undefined;
    return walletService.watchTransaction(pending.txId, (t) => {
      setTx(t);
      if (t.status === TX_STATUS.SUCCESS) setStep('success');
      if (t.status === TX_STATUS.FAILED) setStep('failed');
    });
  }, [pending]);

  async function submit() {
    setTouched(true);
    if (!amountCheck.ok || !phoneCheck.ok) return;
    const res = await create.run({ amount, operator, msisdn: phoneCheck.e164 });
    if (!res) return;
    setPending({ ...res, firstDeposit: isFirstDeposit });
    setStep(res.status === TX_STATUS.SUCCESS ? 'success' : res.status === TX_STATUS.FAILED ? 'failed' : 'awaiting');
  }

  async function confirmOnPhone() {
    const res = await confirm.run(pending.txId);
    if (res?.bonus) setBonus(res.bonus);
  }

  async function abandon() {
    await cancel.run(pending.txId);
  }

  function restart() {
    setStep('form'); setPending(null); setTx(null); setBonus(0); setTouched(false);
  }

  return {
    step,
    limits: DEPOSIT_LIMITS,
    operator, setOperator,
    amount, setAmount,
    msisdn, setMsisdn,
    errors: {
      amount: touched && !amountCheck.ok ? amountCheck.message : null,
      msisdn: touched && !phoneCheck.ok ? phoneCheck.message : null,
    },
    isFirstDeposit,
    bonusPreview,
    bonusRule: WELCOME_BONUS,
    submit, submitting: create.pending, submitError: create.error,
    reference: pending?.reference,
    canConfirmManually: Boolean(pending?.allowsManualConfirmation),
    confirmOnPhone, confirming: confirm.pending, confirmError: confirm.error,
    abandon, abandoning: cancel.pending,
    tx,
    bonus: bonus || (pending?.firstDeposit && tx?.status === TX_STATUS.SUCCESS ? computeWelcomeBonus(tx.amount, true).amount : 0),
    newBalance: tx?.balanceAfter ?? null,
    restart,
  };
}
