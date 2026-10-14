import { dataSource } from '../services/index.js';
import s from './AppShell.module.css';

/** Bandeau visible uniquement en mode démo, pour ne jamais confondre avec la production. */
export function DemoBanner() {
  if (dataSource !== 'mock') return null;
  const reset = async () => (await import('../services/mock/store.js')).resetMock();
  return (
    <div className={s.demo}>
      Démo · argent fictif
      <button type="button" onClick={reset}>Réinitialiser</button>
    </div>
  );
}
