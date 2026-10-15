import { createContext, useContext, useEffect, useState } from 'react';
import { playerAuthService } from '../services/index.js';

const PlayerSessionContext = createContext();

export function PlayerSessionProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = playerAuthService.onAuthChange((p, err) => {
      if (err) {
        setError(err.message);
        setStatus('guest');
      } else if (p) {
        setPlayer(p);
        setStatus('authenticated');
        setError(null);
      } else {
        setPlayer(null);
        setStatus('guest');
        setError(null);
      }
    });
    return () => unsub?.();
  }, []);

  const signIn = async (email, password) => {
    try {
      await playerAuthService.signIn(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, fullName, phone) => {
    try {
      await playerAuthService.signUp(email, password, { fullName, phone });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await playerAuthService.signOut();
      setPlayer(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PlayerSessionContext.Provider value={{ player, status, error, signIn, signUp, signOut }}>
      {children}
    </PlayerSessionContext.Provider>
  );
}

export function usePlayerSession() {
  const ctx = useContext(PlayerSessionContext);
  if (!ctx) throw new Error('usePlayerSession must be used inside PlayerSessionProvider');
  return ctx;
}
