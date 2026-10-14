import { useCallback, useRef, useState } from 'react';

/**
 * Exécute une action asynchrone en suivant son état.
 * run() renvoie le résultat, ou undefined si l'action a échoué (l'erreur est dans `error`).
 */
export function useAsyncAction(action) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const run = useCallback(async (...args) => {
    setPending(true);
    setError(null);
    try {
      return await actionRef.current(...args);
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue.');
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error, setError, clearError: () => setError(null) };
}
