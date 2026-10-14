/**
 * Paramètres des 4 jeux. Les probabilités sont des poids entiers (sur 10 000
 * ou sur 100) pour que le calcul soit exact. Le taux de retour au joueur (RTP)
 * de chaque jeu est vérifié par les tests : il doit rester sous 100 %.
 * Ces valeurs seront modifiables depuis l'admin à une prochaine étape.
 */

export const GAME = Object.freeze({
  LUCKY_SPIN: 'lucky_spin',
  MYSTERY_BOX: 'mystery_box',
  LUCKY_NUMBER: 'lucky_number',
  JACKPOT: 'jackpot',
});

export const GAME_LABEL = Object.freeze({
  lucky_spin: 'Lucky Spin',
  mystery_box: 'Mystery Box',
  lucky_number: 'Lucky Number',
  jackpot: 'Jackpot quotidien',
});

export const GAME_ICON = Object.freeze({
  lucky_spin: '🎡',
  mystery_box: '🎁',
  lucky_number: '🔢',
  jackpot: '👑',
});

/** Roue : segments dans l'ordre d'affichage (sens horaire, depuis le haut). RTP 89,9 %. */
export const LUCKY_SPIN = Object.freeze({
  minStake: 100,
  maxStake: 10_000,
  quickStakes: [1_000, 2_000, 5_000, 10_000],
  segments: Object.freeze([
    { multiplier: 2, weight: 250, color: '#7c3aed' },
    { multiplier: 5, weight: 200, color: '#3b82f6' },
    { multiplier: 10, weight: 50, color: '#0ea5e9' },
    { multiplier: 50, weight: 20, color: '#e11d48' },
    { multiplier: 1, weight: 800, color: '#9333ea' },
    { multiplier: 0.5, weight: 8380, color: '#1d4ed8' },
    { multiplier: 10, weight: 50, color: '#16a34a' },
    { multiplier: 2, weight: 250, color: '#f97316' },
  ]),
});

/** 9 coffres au contenu tiré indépendamment ; le joueur gagne celui qu'il a choisi. RTP 89 %. */
export const MYSTERY_BOX = Object.freeze({
  minStake: 100,
  maxStake: 10_000,
  quickStakes: [1_000, 2_000, 5_000, 10_000],
  boxCount: 9,
  prizes: Object.freeze([
    { multiplier: 0, weight: 41 },
    { multiplier: 0.5, weight: 20 },
    { multiplier: 1, weight: 20 },
    { multiplier: 2, weight: 12 },
    { multiplier: 3, weight: 5 },
    { multiplier: 10, weight: 2 },
  ]),
});

/** 5 numéros parmi 50, tirage toutes les 15 minutes. RTP ≈ 70 % (jeu de type loterie). */
export const LUCKY_NUMBER = Object.freeze({
  minStake: 100,
  maxStake: 1_000,
  quickStakes: [100, 200, 500, 1_000],
  pick: 5,
  maxNumber: 50,
  intervalMinutes: 15,
  /** Les tickets ne sont plus acceptés pendant les dernières secondes avant le tirage. */
  closeBeforeSeconds: 30,
  /** bons numéros -> multiplicateur de la mise */
  payTable: Object.freeze({ 2: 6, 3: 60, 4: 200, 5: 1_000 }),
  maxWin: 1_000_000,
});

/** Jackpot : tickets à prix fixe, un gagnant par jour à 20:00 (heure de Lomé). */
export const JACKPOT = Object.freeze({
  ticketPrice: 1_000,
  maxTicketsPerPurchase: 50,
  quickTickets: [1, 2, 5, 10],
  /** Part de chaque ticket reversée à la cagnotte ; le reste est la marge. */
  poolShare: 0.8,
  /** Montant garanti de départ (financé par Wynveo). 0 = pas de garantie. */
  seed: 0,
  drawHourUtc: 20,
});
