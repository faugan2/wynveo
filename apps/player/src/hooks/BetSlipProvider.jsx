import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SLIP_TYPE, SPORT_LIMITS, MARKET, marketLabel, buildTickets, combinedOdds, potentialWin, displayBalance, currentOdds, eventName, outcomeLabel,
} from '@wynveo/core';
import { sportService } from '../services/index.js';
import { useSession } from './SessionProvider.jsx';

const KEY = 'wynveo-slip-v1';
const BetSlipContext = createContext(null);

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s && Array.isArray(s.selections)) return s;
  } catch { /* stockage indisponible */ }
  return { selections: [], type: SLIP_TYPE.SINGLE, stake: 1000 };
}

/**
 * Coupon de paris : choix, type (simple/combiné), mise, validation.
 * Gardé dans le navigateur pour ne pas perdre le coupon en changeant de page.
 * selection : { eventId, market, outcome, odds, event, league, sport, pick, startAt }
 */
export function BetSlipProvider({ children }) {
  const { wallet } = useSession();
  const [slip, setSlip] = useState(load);
  const [status, setStatus] = useState('idle'); // idle | placing | done
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState(null);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(slip)); } catch { /* ignoré */ } }, [slip]);

  const update = (fn) => { setSlip((s) => fn(s)); setError(null); setChanges(null); if (status === 'done') setStatus('idle'); };
  const key = (s) => `${s.eventId}|${s.market}|${s.outcome}`;

  const has = useCallback((sel) => slip.selections.some((s) => key(s) === key(sel)), [slip.selections]);

  const toggle = (sel) => update((s) => {
    if (s.selections.some((x) => key(x) === key(sel))) return { ...s, selections: s.selections.filter((x) => key(x) !== key(sel)) };
    // Un seul choix par match et par marché : le nouveau remplace l'ancien.
    const others = s.selections.filter((x) => !(x.eventId === sel.eventId && x.market === sel.market));
    if (others.length >= SPORT_LIMITS.maxSelections) return s;
    const selections = [...others, { ...sel, startAt: new Date(sel.startAt).toISOString() }];
    const distinct = new Set(selections.map((x) => x.eventId)).size === selections.length;
    // Deux matchs ou plus : on propose le combiné par défaut.
    const type = selections.length >= 2 && distinct && s.selections.length < 2 ? SLIP_TYPE.COMBO : s.type;
    return { ...s, selections, type };
  });
  const remove = (sel) => update((s) => ({ ...s, selections: s.selections.filter((x) => key(x) !== key(sel)) }));
  const clear = () => update((s) => ({ ...s, selections: [] }));
  const setType = (type) => update((s) => ({ ...s, type }));
  const setStake = (stake) => update((s) => ({ ...s, stake: Math.max(0, Math.min(SPORT_LIMITS.maxStake, Math.floor(Number(stake) || 0))) }));

  const summary = useMemo(() => {
    const { selections, type, stake } = slip;
    const sameEvent = new Set(selections.map((x) => x.eventId)).size !== selections.length;
    const check = buildTickets({ type, stake, selections });
    const totalStake = type === SLIP_TYPE.COMBO ? stake : stake * selections.length;
    const odds = type === SLIP_TYPE.COMBO && selections.length ? combinedOdds(selections.map((x) => x.odds)) : null;
    const win = type === SLIP_TYPE.COMBO
      ? (odds ? potentialWin(stake, odds) : 0)
      : selections.reduce((sum, x) => sum + potentialWin(stake, x.odds), 0);
    const balance = displayBalance(wallet);
    const enough = totalStake <= balance;
    return {
      count: selections.length, totalStake, odds, potentialWin: win, sameEvent, balance,
      canCombo: selections.length >= 2 && !sameEvent,
      problem: !selections.length ? null : !check.ok ? check.message : !enough ? 'Solde insuffisant pour cette mise.' : null,
    };
  }, [slip, wallet]);

  /** Valide le coupon. Si les cotes ont bougé, on les met à jour et on demande confirmation. */
  const place = async ({ acceptOddsChanges = false } = {}) => {
    setStatus('placing');
    setError(null);
    try {
      const res = await sportService.placeBet({
        type: slip.type, stake: slip.stake, acceptOddsChanges,
        selections: slip.selections.map(({ eventId, market, outcome, odds }) => ({ eventId, market, outcome, odds })),
      });
      setReceipt({ ...res, type: slip.type, selections: slip.selections });
      setSlip((s) => ({ ...s, selections: [] }));
      setChanges(null);
      setStatus('done');
      return res;
    } catch (err) {
      const list = err?.details?.changes;
      if (err.code === 'ODDS_CHANGED' && list) {
        setSlip((s) => ({ ...s, selections: s.selections.map((x) => { const c = list.find((y) => key(y) === key(x)); return c ? { ...x, odds: c.newOdds, previousOdds: x.odds } : x; }) }));
        setChanges(list);
      } else if (err.code === 'ODDS_CLOSED' && list) {
        const closed = new Set(list.filter((c) => c.closed).map(key));
        setSlip((s) => ({ ...s, selections: s.selections.map((x) => (closed.has(key(x)) ? { ...x, closed: true } : x)) }));
      }
      setError(err.message);
      setStatus('idle');
      return undefined;
    }
  };

  const removeClosed = () => update((s) => ({ ...s, selections: s.selections.filter((x) => !x.closed) }));
  const dismissReceipt = () => { setReceipt(null); setStatus('idle'); };

  const value = {
    ...slip, has, toggle, remove, clear, setType, setStake, removeClosed, summary, place,
    placing: status === 'placing', error, oddsChanged: Boolean(changes?.length), receipt, dismissReceipt,
  };
  return <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>;
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error('useBetSlip doit être utilisé dans <BetSlipProvider>.');
  return ctx;
}

/** Choix prêt pour le coupon à partir d'un match et d'une issue. */
export function selectionFor(event, market, outcome) {
  const line = market === MARKET.TOTALS ? event.markets?.totals?.line : null;
  return {
    eventId: event.id, market, outcome, line, odds: currentOdds(event, market, outcome),
    event: eventName(event), league: event.league, sport: event.sport, startAt: event.startAt,
    pick: outcomeLabel(event, market, outcome, line), marketLabel: marketLabel(event.sport, market),
  };
}

/** Libellé court d'une issue sur un bouton de cote : 1 / N / 2, +2.5 / -2.5. */
export function shortLabel(event, market, outcome) {
  if (market === MARKET.TOTALS) return `${outcome === 'over' ? '+' : '−'} ${event.markets?.totals?.line}`;
  return { home: '1', draw: 'N', away: '2' }[outcome];
}
