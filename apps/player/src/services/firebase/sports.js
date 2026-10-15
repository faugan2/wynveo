import { db } from '../../config/firebase.js';

if (!db) {
  throw new Error('Firebase sports service requires VITE_DATA_SOURCE=firebase and valid Firebase credentials in .env');
}

export const playerSportsService = {
  async getEvents(userId) {
    const snap = await db.collection('sports_events').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async placeBet(uid, eventId, selection, amount) {
    const eventDoc = await db.collection('sports_events').doc(eventId).get();
    if (!eventDoc.exists) throw new Error('Événement non trouvé');

    const event = eventDoc.data();
    const odds = event.markets.h2h[selection];
    const potentialWin = amount * odds;

    const bet = {
      userId: uid,
      eventId,
      selection,
      amount,
      odds,
      potentialWin,
      status: 'pending',
      createdAt: new Date(),
    };

    const ref = await db.collection('users').doc(uid).collection('sports_bets').add(bet);
    return { id: ref.id, ...bet };
  },
};
