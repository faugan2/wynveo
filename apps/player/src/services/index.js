/**
 * Point d'accès unique aux données pour toute l'application.
 * Les hooks importent d'ici, jamais de Firebase directement.
 * VITE_DATA_SOURCE=mock charge la démo hors ligne ; sinon Firebase.
 */
const impl = import.meta.env.VITE_DATA_SOURCE === 'mock'
  ? await import('./mock/index.js')
  : await import('./firebase/index.js');

export const { authService, profileService, walletService, gamesService, dataSource } = impl;
export { AppError } from './errors.js';
