import { useEffect, useState } from 'react';
import { sportsService } from '../services/mock/sports.js';
import { usePlayerSession } from './PlayerSession.jsx';

export function useSports() {
  const { player } = usePlayerSession();
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await sportsService.getEvents();
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
      const bet = await sportsService.placeBet(player.uid, { eventId, selection, amount });
      return bet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { events, loading, error, placeBet };
}
