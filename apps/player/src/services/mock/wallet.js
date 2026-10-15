const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const mockTransactions = [
  { id: 'tx1', type: 'deposit', amount: 50000, method: 'TMONEY', status: 'success', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'tx2', type: 'withdrawal', amount: 25000, method: 'FLOOZ', status: 'success', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: 'tx3', type: 'deposit', amount: 100000, method: 'TMONEY', status: 'success', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
];

export const walletService = {
  async getBalance(uid) {
    await delay();
    return {
      balance: 125000,
      totalDeposited: 500000,
      totalWithdrawn: 375000,
    };
  },

  async getTransactions(uid) {
    await delay();
    return mockTransactions;
  },

  async createDeposit(uid, { amount, method }) {
    await delay(1500);
    const tx = {
      id: `tx_${Date.now()}`,
      type: 'deposit',
      amount,
      method,
      status: 'pending',
      date: new Date(),
    };
    mockTransactions.unshift(tx);
    return tx;
  },

  async requestWithdrawal(uid, { amount, method }) {
    await delay(1500);
    const tx = {
      id: `tx_${Date.now()}`,
      type: 'withdrawal',
      amount,
      method,
      status: 'pending',
      date: new Date(),
    };
    mockTransactions.unshift(tx);
    return tx;
  },
};
