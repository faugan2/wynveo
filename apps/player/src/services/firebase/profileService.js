import { db, functions } from '../../config/firebase.js';
import { wrap, toAppError } from '../errors.js';
import { mapProfile } from './mappers.js';

export const profileService = {
  /** cb(profile | null) ; null tant que l'inscription n'est pas terminée. */
  watchProfile(uid, cb, onError) {
    return db.collection('users').doc(uid).onSnapshot(
      (snap) => cb(mapProfile(snap)),
      (err) => onError?.(toAppError(err)),
    );
  },

  completeProfile: wrap(async ({ fullName, referralCode, ageConfirmed }) => {
    const res = await functions.httpsCallable('playerCompleteProfile')({ fullName, referralCode, ageConfirmed });
    return res.data;
  }),
};
