/** Mystery Box : choisir un coffre, miser, ouvrir. 'idle' -> 'opening' -> 'result'. */
import { useState } from 'react';
import { MYSTERY_BOX, displayBalance } from '@wynveo/core';
import { gamesService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';
import { useStake } from './useStake.js';
import { useAsyncAction } from './useAsyncAction.js';

export function useMysteryBox() {
  const { wallet, heldBalance, holdBalance, releaseBalance } = useSession();
  const stake = useStake(MYSTERY_BOX);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const action = useAsyncAction(gamesService.playBox);

  async function play() {
    if (selected === null) { action.setError('Choisissez d\'abord une boîte.'); return; }
    holdBalance(displayBalance(wallet));
    const res = await action.run({ stake: stake.stake, box: selected });
    if (!res) { releaseBalance(); return; }
    setResult(res);
    setPhase('opening');
  }

  function select(i) {
    if (phase === 'opening') return;
    if (phase === 'result') { setPhase('idle'); setResult(null); }
    setSelected(i);
    action.clearError();
  }

  return {
    boxCount: MYSTERY_BOX.boxCount,
    stake, balance: heldBalance ?? displayBalance(wallet),
    selected, select, phase, result,
    play, pending: action.pending, error: action.error,
    onRevealed: () => { setPhase('result'); releaseBalance(); },
    playAgain: () => { setPhase('idle'); setResult(null); setSelected(null); },
  };
}
