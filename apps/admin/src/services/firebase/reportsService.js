import { functions } from '../../config/firebase.js';
import { wrap } from '../errors.js';

const call = (name) => wrap(async (data) => (await functions.httpsCallable(name)(data)).data);

export const reportsService = {
  getFinancialSummary: call('adminGetFinancialSummary'),
  getUserFinancialStats: call('adminGetUserFinancialStats'),
  getReportByPeriod: call('adminGetReportByPeriod'),
};
