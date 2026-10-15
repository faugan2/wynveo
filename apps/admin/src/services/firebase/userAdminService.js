import { functions } from '../../config/firebase.js';
import { wrap } from '../errors.js';

const call = (name) => wrap(async (data) => (await functions.httpsCallable(name)(data)).data);

export const userAdminService = {
  listUsers: call('adminListUsers'),
  getUser: call('adminGetUser'),
  setSuspended: call('adminSetSuspended'),
  resetPassword: call('adminResetPassword'),
};
