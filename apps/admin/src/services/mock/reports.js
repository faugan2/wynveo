/**
 * Données de rapports et analytics en démo.
 */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const mockUsers = [
  { uid: 'p1', fullName: 'Ama Kpodar', phone: '+22891442108', totalDeposited: 210_000, totalWithdrawn: 40_000, balance: 5_000, depositCount: 12, withdrawalCount: 3, status: 'active' },
  { uid: 'p2', fullName: 'Yao Dossou', phone: '+22896771052', totalDeposited: 90_000, totalWithdrawn: 0, balance: 12_500, depositCount: 8, withdrawalCount: 0, status: 'active' },
  { uid: 'p3', fullName: 'Edem Agbo', phone: '+22892056631', totalDeposited: 60_000, totalWithdrawn: 15_000, balance: 3_200, depositCount: 5, withdrawalCount: 1, status: 'active' },
  { uid: 'p4', fullName: 'Afi Folly', phone: '+22890478512', totalDeposited: 74_000, totalWithdrawn: 20_000, balance: 0, depositCount: 6, withdrawalCount: 2, status: 'suspended' },
];

export const reportsService = {
  async getFinancialSummary({ startDate = null, endDate = null } = {}) {
    await delay();
    return {
      date: new Date(),
      totalUsers: 4,
      activeUsers: 3,
      suspendedUsers: 1,
      totalDeposited: 434_000,
      totalWithdrawn: 75_000,
      balance: 359_000,
      totalStaked: 182_000,
      totalWon: 145_000,
      playerROI: '-20.3',
      platformMargin: '20.3',
    };
  },

  async getUserFinancialStats({ limit = 20, sort = 'top' } = {}) {
    await delay();
    let users = [...mockUsers];
    if (sort === 'low') {
      users.sort((a, b) => a.totalDeposited - b.totalDeposited);
    } else {
      users.sort((a, b) => b.totalDeposited - a.totalDeposited);
    }
    return users.slice(0, limit);
  },

  async getReportByPeriod({ startDate, endDate, period = 'day' } = {}) {
    await delay();
    // Générer des données de rapport par jour
    const days = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      days.push({
        date: current.toISOString().split('T')[0],
        deposits: Math.floor(Math.random() * 150_000) + 50_000,
        withdrawals: Math.floor(Math.random() * 50_000) + 10_000,
        count: Math.floor(Math.random() * 50) + 10,
      });
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
    return days;
  },
};
