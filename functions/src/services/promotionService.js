/**
 * Gestion des promotions : codes promo, bonus, campaigns.
 */
import { HttpsError } from 'firebase-functions/v2/https';
import { db, COL, FieldValue } from '../lib/firebase.js';

const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : null);

/** Crée un nouveau code promo. */
export async function createPromoCode(admin, { code, type, value, maxUses = null, expiresAt = null, minDeposit = 0 }) {
  if (!code || code.length < 3) throw new HttpsError('invalid-argument', 'Code invalide.');
  if (!['percent', 'fixed'].includes(type)) throw new HttpsError('invalid-argument', 'Type invalide.');
  if (value <= 0) throw new HttpsError('invalid-argument', 'Valeur invalide.');

  const codeRef = db.collection(COL.PROMO_CODES).doc(code);
  const existing = await codeRef.get();
  if (existing.exists()) throw new HttpsError('already-exists', 'Code déjà existe.');

  await codeRef.set({
    code,
    type,
    value,
    maxUses,
    usedCount: 0,
    minDeposit,
    active: true,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: admin.email,
  });

  return { ok: true };
}

/** Liste les codes promo. */
export async function listPromoCodes({ active = null } = {}) {
  let query = db.collection(COL.PROMO_CODES);
  if (active !== null) {
    query = query.where('active', '==', active);
  }

  const snap = await query.get();
  return snap.docs.map((doc) => ({
    code: doc.id,
    ...doc.data(),
    expiresAt: toDate(doc.data().expiresAt),
    createdAt: toDate(doc.data().createdAt),
  }));
}

/** Valide et utilise un code promo. */
export async function validatePromoCode(code, depositAmount = 0) {
  const codeSnap = await db.collection(COL.PROMO_CODES).doc(code).get();
  if (!codeSnap.exists()) throw new HttpsError('not-found', 'Code invalide.');

  const codeData = codeSnap.data();

  // Vérifications
  if (!codeData.active) throw new HttpsError('invalid-argument', 'Code désactivé.');
  if (codeData.expiresAt && toDate(codeData.expiresAt) < new Date()) {
    throw new HttpsError('invalid-argument', 'Code expiré.');
  }
  if (codeData.maxUses && codeData.usedCount >= codeData.maxUses) {
    throw new HttpsError('invalid-argument', 'Code limite atteinte.');
  }
  if (depositAmount < codeData.minDeposit) {
    throw new HttpsError('invalid-argument', `Dépôt minimum ${codeData.minDeposit} requis.`);
  }

  // Calculer la réduction
  const bonus = codeData.type === 'percent'
    ? (depositAmount * codeData.value / 100)
    : codeData.value;

  return { bonus, code };
}

/** Marque un code comme utilisé. */
export async function usePromoCode(code, uid) {
  await db.collection(COL.PROMO_CODES).doc(code).update({
    usedCount: FieldValue.increment(1),
  });

  // Log l'utilisation
  await db.collection(COL.PROMO_USAGE).add({
    code,
    uid,
    usedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
}

/** Récupère les statistiques des codes promo. */
export async function getPromoStats() {
  const codesSnap = await db.collection(COL.PROMO_CODES).get();
  const usageSnap = await db.collection(COL.PROMO_USAGE).get();

  const codes = [];
  codesSnap.forEach((doc) => {
    const data = doc.data();
    const usage = usageSnap.docs.filter((u) => u.data().code === doc.id).length;
    codes.push({
      code: doc.id,
      type: data.type,
      value: data.value,
      active: data.active,
      usedCount: data.usedCount,
      usage,
      remaining: data.maxUses ? data.maxUses - data.usedCount : '∞',
    });
  });

  return {
    totalCodes: codes.length,
    activeCodes: codes.filter((c) => c.active).length,
    totalUsed: codes.reduce((s, c) => s + c.usedCount, 0),
    codes,
  };
}
