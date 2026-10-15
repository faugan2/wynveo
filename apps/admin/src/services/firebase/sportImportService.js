import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.js';
import { wrap } from '../errors.js';

export const sportImportService = {
  importOddsNow: wrap(async () => {
    const fn = httpsCallable(functions, 'adminSportImportNow');
    const result = await fn({});
    return result.data;
  }),
};
