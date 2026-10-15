const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const sportImportService = {
  async importOddsNow() {
    // Simulate API call delay + processing
    await delay(2000);
    return {
      created: 24,
      updated: 18,
      remaining: 892,
      message: 'Import réussi: 24 nouveaux matchs, 18 mis à jour',
    };
  },
};
