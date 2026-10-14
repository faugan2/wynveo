import { HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue } from '../lib/firebase.js';
import { assertRule } from '../lib/guards.js';
import { userRef, walletRef, referralRef, walletUpdate } from '../repositories/index.js';
import {
  validateFullName, validateReferralCode, makeReferralCode, createEmptyWallet, KYC_STATUS, ACCOUNT_STATUS,
} from '../core/index.js';

/**
 * Termine l'inscription juste après la création du compte (numéro + mot de passe) :
 * crée le profil, le portefeuille et le code parrain du joueur.
 * Le numéro reste "à confirmer" jusqu'au premier dépôt fait depuis ce numéro.
 * Sans effet si le profil existe déjà.
 */
export async function completeProfile(uid, { phone, phoneVerified }, input) {
  if (!phone) throw new HttpsError('failed-precondition', 'Connectez-vous avec votre numéro de téléphone.');
  const name = assertRule(validateFullName(input?.fullName)).value;
  const referral = assertRule(validateReferralCode(input?.referralCode)).value;
  if (input?.ageConfirmed !== true) {
    throw new HttpsError('failed-precondition', 'Vous devez avoir 18 ans ou plus pour jouer.', { code: 'AGE_REQUIRED' });
  }

  return db.runTransaction(async (t) => {
    const existing = await t.get(userRef(uid));
    if (existing.exists) return { created: false };

    let referredBy = null;
    if (referral) {
      const refSnap = await t.get(referralRef(referral));
      if (!refSnap.exists) throw new HttpsError('failed-precondition', "Ce code parrain n'existe pas.", { code: 'REFERRAL_UNKNOWN' });
      referredBy = refSnap.data().uid;
    }

    const candidates = [0, 1, 2, 3, 4].map(() => makeReferralCode(name));
    const snaps = await Promise.all(candidates.map((c) => t.get(referralRef(c))));
    const free = candidates.find((c, i) => !snaps[i].exists);
    const myCode = free ?? `WYN${uid.slice(0, 8).toUpperCase()}`;

    t.set(userRef(uid), {
      fullName: name,
      phone,
      referralCode: myCode,
      referredBy,
      phoneVerified: Boolean(phoneVerified),
      phoneVerifiedAt: phoneVerified ? FieldValue.serverTimestamp() : null,
      kycStatus: KYC_STATUS.NONE,
      status: ACCOUNT_STATUS.ACTIVE,
      ageConfirmedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    t.set(walletRef(uid), { ...walletUpdate(createEmptyWallet()), createdAt: FieldValue.serverTimestamp() });
    t.set(referralRef(myCode), { uid, createdAt: FieldValue.serverTimestamp() });
    return { created: true };
  });
}

/** Charge le profil d'un joueur actif, sinon lève une erreur. Utilisable dans une transaction. */
export async function getActivePlayer(uid, t = null) {
  const snap = t ? await t.get(userRef(uid)) : await userRef(uid).get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Terminez votre inscription.', { code: 'PROFILE_MISSING' });
  const user = snap.data();
  if (user.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new HttpsError('permission-denied', 'Votre compte est suspendu. Contactez le support.', { code: 'ACCOUNT_SUSPENDED' });
  }
  return user;
}
