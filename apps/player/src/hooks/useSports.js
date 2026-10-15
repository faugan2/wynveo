import { useEffect, useState } from 'react';
import { playerSportsService } from '../services/index.js';
import { usePlayerSession } from './PlayerSession.jsx';

export function useSports() {
  const { player } = usePlayerSession();
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await playerSportsService.getEvents(player.uid);
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const placeBet = async (eventId, selection, amount) => {
    try {
      const bet = await playerSportsService.placeBet(player.uid, eventId, selection, amount);
      return bet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { events, loading, error, placeBet };
}
