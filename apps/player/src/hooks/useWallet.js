import { useEffect, useState } from 'react';
import { walletService } from '../services/mock/wallet.js';
import { usePlayerSession } from './PlayerSession.jsx';

export function useWallet() {
  const { player } = usePlayerSession();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [bal, txs] = await Promise.all([
          walletService.getBalance(player.uid),
          walletService.getTransactions(player.uid),
        ]);
        setBalance(bal);
        setTransactions(txs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [player.uid]);

  const createDeposit = async (amount, method) => {
    try {
      const tx = await walletService.createDeposit(player.uid, { amount, method });
      setTransactions((prev) => [tx, ...prev]);
      return tx;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const requestWithdrawal = async (amount, method) => {
    try {
      const tx = await walletService.requestWithdrawal(player.uid, { amount, method });
      setTransactions((prev) => [tx, ...prev]);
      return tx;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { balance, transactions, loading, error, createDeposit, requestWithdrawal };
}
