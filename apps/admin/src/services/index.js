/** Point d'accès unique aux données du back-office. */
const impl = import.meta.env.VITE_DATA_SOURCE === 'mock'
  ? await import('./mock/index.js')
  : await import('./firebase/index.js');

export const { adminAuthService, withdrawalAdminService, sportAdminService, userAdminService, reportsService, dataSource } = impl;
