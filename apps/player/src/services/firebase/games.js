import { db } from '../../config/firebase.js';

if (!db) {
  throw new Error('Firebase games service requires VITE_DATA_SOURCE=firebase and valid Firebase credentials in .env');
}

export const playerGamesService = {
  async playLuckyNumbers(userId, numbers, amount) {
    const drawn = Math.floor(Math.random() * 50) + 1;
    const matched = numbers.filter((n) => n === drawn).length;
    const won = matched > 0;
    const payout = won ? amount * 5 : 0;

    await db.collection('users').doc(userId).collection('game_plays').add({
      game: 'lucky_numbers',
      amount,
      payout,
      result: { drawn, matched },
      createdAt: new Date(),
    });

    return { won, payout, result: { drawn, matched } };
  },

  async playJackpot(userId, amount) {
    const rand = Math.random();
    let multiplier = 0;
    
    if (rand > 0.95) multiplier = 50;
    else if (rand > 0.85) multiplier = 10;
    else if (rand > 0.70) multiplier = 2;

    const won = multiplier > 0;
    const payout = amount * multiplier;

    await db.collection('users').doc(userId).collection('game_plays').add({
      game: 'jackpot',
      amount,
      payout,
      multiplier,
      createdAt: new Date(),
    });

    return { won, payout, multiplier };
  },

  async playBox(userId, number, amount) {
    const drawn = Math.floor(Math.random() * 10);
    const won = parseInt(number) === drawn;
    const payout = won ? amount * 9 : 0;

    await db.collection('users').doc(userId).collection('game_plays').add({
      game: 'box',
      amount,
      payout,
      result: { selected: parseInt(number), drawn },
      createdAt: new Date(),
    });

    return { won, payout, result: { selected: parseInt(number), drawn } };
  },
};
