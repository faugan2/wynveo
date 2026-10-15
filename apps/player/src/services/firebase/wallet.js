import { db } from '../../config/firebase.js';

if (!db) {
  throw new Error('Firebase wallet service requires VITE_DATA_SOURCE=firebase and valid Firebase credentials in .env');
}

export const playerWalletService = {
  async getBalance(userId) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return 0;
    return doc.data().balance || 0;
  },

  async getTransactions(userId, limit = 50) {
    const snap = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async createDeposit(userId, amount, method) {
    const deposit = {
      type: 'deposit',
      amount,
      method,
      status: 'pending',
      createdAt: new Date(),
    };

    const ref = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .add(deposit);

    setTimeout(async () => {
      await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc(ref.id)
        .update({ status: 'completed' });

      const userDoc = await db.collection('users').doc(userId).get();
      const currentBalance = userDoc.data().balance || 0;
      await db.collection('users').doc(userId).update({
        balance: currentBalance + amount,
      });
    }, 2000);

    return { id: ref.id, ...deposit };
  },

  async requestWithdrawal(userId, amount, method) {
    const userDoc = await db.collection('users').doc(userId).get();
    const currentBalance = userDoc.data().balance || 0;

    if (currentBalance < amount) {
      throw new Error('Solde insuffisant');
    }

    const withdrawal = {
      type: 'withdrawal',
      amount,
      method,
      status: 'pending',
      createdAt: new Date(),
    };

    const ref = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .add(withdrawal);

    await db.collection('users').doc(userId).update({
      balance: currentBalance - amount,
    });

    return { id: ref.id, ...withdrawal };
  },
};
