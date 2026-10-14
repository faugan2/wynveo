/**
 * Lucky Spin : 'idle' -> 'spinning' (la roue tourne vers le segment tiré par le serveur) -> 'result'.
 * L'écran appelle onSpinEnd() quand l'animation est terminée.
 */
import { useState } from 'react';
import { LUCKY_SPIN, displayBalance } from '@wynveo/core';
import { gamesService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useStake } from './useStake.js';
import { useAsyncAction } from './useAsyncAction.js';

export function useLuckySpin() {
  const { wallet, heldBalance, holdBalance, releaseBalance } = useSession();
  const stake = useStake(LUCKY_SPIN);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [spinId, setSpinId] = useState(0);
  const action = useAsyncAction(gamesService.playSpin);

  async function play() {
    if (phase === 'spinning') return;
    holdBalance(displayBalance(wallet));
    const res = await action.run({ stake: stake.stake });
    if (!res) { releaseBalance(); return; }
    setResult(res);
    setSpinId((n) => n + 1);
    setPhase('spinning');
  }

  return {
    segments: LUCKY_SPIN.segments,
    stake,
    balance: heldBalance ?? displayBalance(wallet),
    phase, result, spinId,
    targetIndex: result?.outcome.segmentIndex ?? null,
    play, pending: action.pending, error: action.error,
    onSpinEnd: () => { setPhase('result'); releaseBalance(); },
    closeResult: () => setPhase('idle'),
  };
}
