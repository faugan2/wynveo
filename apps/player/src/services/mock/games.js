const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const gamesService = {
  async playLuckyNumbers(uid, { numbers, amount }) {
    await delay(2000);
    const drawnNumber = Math.floor(Math.random() * 50) + 1;
    const won = numbers.includes(drawnNumber);
    return {
      id: `game_${Date.now()}`,
      type: 'lucky_numbers',
      numbers,
      amount,
      drawnNumber,
      won,
      payout: won ? amount * 5 : 0,
      playedAt: new Date(),
    };
  },

  async playJackpot(uid, { amount }) {
    await delay(1500);
    const multiplier = Math.random();
    let win = false;
    let payout = 0;

    if (multiplier > 0.95) {
      win = true;
      payout = amount * 50; // Gros jackpot
    } else if (multiplier > 0.85) {
      win = true;
      payout = amount * 10;
    } else if (multiplier > 0.70) {
      win = true;
      payout = amount * 2;
    }

    return {
      id: `game_${Date.now()}`,
      type: 'jackpot',
      amount,
      won: win,
      payout,
      playedAt: new Date(),
    };
  },

  async playBox(uid, { selection, amount }) {
    await delay(1500);
    const result = Math.floor(Math.random() * 10);
    const won = result.toString() === selection;
    return {
      id: `game_${Date.now()}`,
      type: 'box',
      selection,
      result,
      amount,
      won,
      payout: won ? amount * 9 : 0,
      playedAt: new Date(),
    };
  },
};
