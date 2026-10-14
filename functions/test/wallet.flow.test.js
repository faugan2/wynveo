/**
 * Parcours complets du portefeuille, exécutés sur les vrais services
 * avec un Firestore en mémoire.
 * Lancer : node --test --experimental-test-module-mocks test/
 */
import { test, mock, before } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from './fakeFirestore.js';

const fake = createFakeFirestore();
const COL = { USERS: 'users', WALLETS: 'wallets', TRANSACTIONS: 'transactions', ADMIN_LOGS: 'adminLogs', REFERRAL_CODES: 'referralCodes' };

mock.module('../src/lib/firebase.js', {
  namedExports: { db: fake.db, FieldValue: fake.FieldValue, Timestamp: Date, adminAuth: {}, COL },
});

let profile, deposit, withdrawal;
before(async () => {
  profile = await import('../src/services/profileService.js');
  deposit = await import('../src/services/depositService.js');
  withdrawal = await import('../src/services/withdrawalService.js');
});

const wallet = (uid) => fake.db._get(`wallets/${uid}`);
const tx = (id) => fake.db._get(`transactions/${id}`);
const admin = { uid: 'admin1', email: 'finance@wynveo.com' };

async function newPlayer(uid, phone, extra = {}) {
  await profile.completeProfile(uid, { phone, phoneVerified: false }, { fullName: 'Kossi Amouzou', ageConfirmed: true, ...extra });
}
const ident = (phone) => ({ phone, phoneVerified: false });

test('inscription : profil + portefeuille vide + code parrain, idempotent', async () => {
  await newPlayer('u1', '+22890123456');
  assert.equal(fake.db._get('users/u1').fullName, 'Kossi Amouzou');
  assert.equal(wallet('u1').balance, 0);
  assert.equal(fake.db._get('users/u1').phoneVerified, false);
  const again = await profile.completeProfile('u1', ident('+22890123456'), { fullName: 'Autre Nom', ageConfirmed: true });
  assert.equal(again.created, false);
  assert.equal(fake.db._get('users/u1').fullName, 'Kossi Amouzou');
  await assert.rejects(profile.completeProfile('u9', ident('+22890000001'), { fullName: 'Ama K', ageConfirmed: false }), /18 ans/);
  await assert.rejects(profile.completeProfile('u9', ident('+22890000001'), { fullName: 'Ama K', ageConfirmed: true, referralCode: 'NOPE1234' }), /parrain/);
  const code = fake.db._get('users/u1').referralCode;
  await newPlayer('u2', '+22896123456', { referralCode: code });
  assert.equal(fake.db._get('users/u2').referredBy, 'u1');
});

test('dépôt depuis un autre numéro : crédité, mais ni bonus ni vérification', async () => {
  await assert.rejects(withdrawal.requestWithdrawal('u1', { amount: 1000, operator: 'TMONEY' }), /propre numéro/);
  const r = await deposit.startDeposit('u1', { amount: 2000, operator: 'FLOOZ', msisdn: '96 55 44 33' });
  const s = await deposit.confirmSimulatedDeposit('u1', r.txId);
  assert.equal(s.bonus, 0);
  assert.equal(wallet('u1').balance, 2000);
  assert.equal(fake.db._get('users/u1').phoneVerified, false);
  await assert.rejects(withdrawal.requestWithdrawal('u1', { amount: 1000, operator: 'TMONEY' }), /propre numéro/);
});

test('dépôt depuis son numéro : vérifie le numéro, bonus une seule fois, jamais crédité deux fois', async () => {
  const r = await deposit.startDeposit('u1', { amount: 5000, operator: 'TMONEY', msisdn: '90 12 34 56' });
  assert.equal(r.status, 'pending');
  assert.equal(wallet('u1').balance, 2000, 'rien n\'est crédité tant que le joueur n\'a pas confirmé');
  const s = await deposit.confirmSimulatedDeposit('u1', r.txId);
  assert.equal(s.status, 'success');
  assert.equal(s.bonus, 5000);
  assert.equal(fake.db._get('users/u1').phoneVerified, true);
  assert.equal(wallet('u1').balance, 7000);
  assert.equal(wallet('u1').bonusBalance, 5000);
  const twice = await deposit.confirmSimulatedDeposit('u1', r.txId);
  assert.equal(twice.alreadySettled, true);
  assert.equal(wallet('u1').balance, 7000, 'jamais crédité deux fois');

  const r2 = await deposit.startDeposit('u1', { amount: 48000, operator: 'TMONEY', msisdn: '90123456' });
  await deposit.confirmSimulatedDeposit('u1', r2.txId);
  assert.equal(wallet('u1').balance, 55000);
  assert.equal(wallet('u1').bonusBalance, 5000, 'pas de second bonus');

  const bonusTx = Object.values(fake.db._dump()).filter((d) => d.type === 'bonus' && d.uid === 'u1');
  assert.equal(bonusTx.length, 1);
});

test('dépôt : refus des montants hors limites et des confirmations par un autre joueur', async () => {
  await assert.rejects(deposit.startDeposit('u1', { amount: 50, operator: 'TMONEY', msisdn: '90123456' }), /minimum/);
  await assert.rejects(deposit.startDeposit('u1', { amount: 5000, operator: 'MTN', msisdn: '90123456' }), /moyen de paiement/);
  const r = await deposit.startDeposit('u1', { amount: 1000, operator: 'TMONEY', msisdn: '90123456' });
  await assert.rejects(deposit.confirmSimulatedDeposit('u2', r.txId), /introuvable/);
  await deposit.cancelDeposit('u1', r.txId);
  assert.equal(tx(r.txId).status, 'failed');
  assert.equal(wallet('u1').balance, 55000);
});

test('retrait sans KYC : mis de côté, refusé par un admin puis remboursé', async () => {
  const r = await withdrawal.requestWithdrawal('u1', { amount: 15000, operator: 'FLOOZ' });
  assert.equal(r.status, 'pending_review');
  assert.equal(wallet('u1').balance, 40000);
  assert.equal(tx(r.txId).msisdn, '+22890123456', 'paiement uniquement vers le numéro du compte');
  await assert.rejects(withdrawal.reviewWithdrawal(admin, { txId: r.txId, decision: 'reject' }), /motif/);
  await withdrawal.reviewWithdrawal(admin, { txId: r.txId, decision: 'reject', reason: 'Bonus non débloqué' });
  assert.equal(tx(r.txId).status, 'rejected');
  assert.equal(wallet('u1').balance, 55000);
  assert.equal(wallet('u1').withdrawnToday.amount, 0);
  await assert.rejects(withdrawal.reviewWithdrawal(admin, { txId: r.txId, decision: 'approve' }), /déjà été traité/);
  const logs = Object.entries(fake.db._dump()).filter(([p]) => p.startsWith('adminLogs/'));
  assert.equal(logs.length, 1);
});

test('retrait : validé par un admin et payé ; plafond journalier sans KYC', async () => {
  const r = await withdrawal.requestWithdrawal('u1', { amount: 30000, operator: 'TMONEY' });
  const res = await withdrawal.reviewWithdrawal(admin, { txId: r.txId, decision: 'approve' });
  assert.equal(res.status, 'success');
  assert.equal(wallet('u1').balance, 25000);
  assert.equal(wallet('u1').totalWithdrawn, 30000);
  await assert.rejects(withdrawal.requestWithdrawal('u1', { amount: 25000, operator: 'TMONEY' }), /vérifiez d'abord votre identité/);
  await assert.rejects(withdrawal.requestWithdrawal('u1', { amount: 99999, operator: 'TMONEY' }), /insuffisant/);
});

test('retrait joueur vérifié : automatique sous 25 000, et remboursé si l\'opérateur échoue', async () => {
  fake.db._set('users/u3', { fullName: 'Ama Kpodar', phone: '+22891440000', kycStatus: 'verified', status: 'active', phoneVerified: true });
  fake.db._set('wallets/u3', { balance: 40000, bonusBalance: 0, depositCount: 1, withdrawnToday: { date: null, amount: 0 } });
  const r = await withdrawal.requestWithdrawal('u3', { amount: 20000, operator: 'TMONEY' });
  // le numéro finit par 0000 : le prestataire simulé refuse l'envoi
  assert.equal(r.status, 'failed');
  assert.equal(wallet('u3').balance, 40000);

  fake.db._set('users/u4', { fullName: 'Yao Dossou', phone: '+22896771052', kycStatus: 'verified', status: 'active', phoneVerified: true });
  fake.db._set('wallets/u4', { balance: 40000, bonusBalance: 0, depositCount: 1, withdrawnToday: { date: null, amount: 0 } });
  const ok = await withdrawal.requestWithdrawal('u4', { amount: 20000, operator: 'FLOOZ' });
  assert.equal(ok.status, 'success');
  assert.equal(wallet('u4').balance, 20000);
});

test('compte suspendu : ni dépôt ni retrait', async () => {
  fake.db._set('users/u5', { fullName: 'Sena Adjo', phone: '+22990881325', kycStatus: 'none', status: 'suspended' });
  fake.db._set('wallets/u5', { balance: 10000 });
  await assert.rejects(deposit.startDeposit('u5', { amount: 1000, operator: 'TMONEY', msisdn: '90881325' }), /suspendu/);
  await assert.rejects(withdrawal.requestWithdrawal('u5', { amount: 5000, operator: 'TMONEY' }), /suspendu/);
});
