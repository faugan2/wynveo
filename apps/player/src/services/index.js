// Import both mock and Firebase implementations
import * as mockAuth from './mock/auth.js';
import * as mockWallet from './mock/wallet.js';
import * as mockSports from './mock/sports.js';
import * as mockGames from './mock/games.js';

import * as fbAuth from './firebase/auth.js';
import * as fbWallet from './firebase/wallet.js';
import * as fbSports from './firebase/sports.js';
import * as fbGames from './firebase/games.js';

// Switch based on VITE_DATA_SOURCE environment variable
const dataSource = import.meta.env.VITE_DATA_SOURCE || 'mock';

const implementations = {
  mock: { mockAuth, mockWallet, mockSports, mockGames },
  firebase: { fbAuth, fbWallet, fbSports, fbGames },
};

const impl = dataSource === 'firebase' ? implementations.firebase : implementations.mock;

export const playerAuthService = dataSource === 'firebase'
  ? fbAuth.playerAuthService
  : mockAuth.playerAuthService;

export const playerWalletService = dataSource === 'firebase'
  ? fbWallet.playerWalletService
  : mockWallet.playerWalletService;

export const playerSportsService = dataSource === 'firebase'
  ? fbSports.playerSportsService
  : mockSports.playerSportsService;

export const playerGamesService = dataSource === 'firebase'
  ? fbGames.playerGamesService
  : mockGames.playerGamesService;

console.log(`[Services] Loaded with DATA_SOURCE=${dataSource}`);
