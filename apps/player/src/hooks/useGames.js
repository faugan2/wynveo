import { useState } from 'react';
import { playerGamesService } from '../services/index.js';
import { usePlayerSession } from './PlayerSession.jsx';

export function useGames() {
  const { player } = usePlayerSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const playLuckyNumbers = async (numbers, amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await playerGamesService.playLuckyNumbers(player.uid, numbers, amount);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const playJackpot = async (amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await playerGamesService.playJackpot(player.uid, amount);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const playBox = async (selection, amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await playerGamesService.playBox(player.uid, selection, amount);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, playLuckyNumbers, playJackpot, playBox };
}
