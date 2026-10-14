import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFCFA, formatSigned, parseAmount,
  normalizeTogoPhone, formatPhone, maskPhone, guessOperator,
  computeWelcomeBonus, makeReference, validateFullName, validateReferralCode, makeReferralCode, initials,
  createEmptyWallet, validateDepositAmount, validateWithdrawal, withdrawalReviewMode,
  applyDeposit, applyWithdrawalHold, applyWithdrawalRefund, applyWithdrawalPaid,
  currentDailyCounter, dayKey, signedAmount, matchesHistoryFilter,
  phoneToAuthEmail, authEmailToPhone, validatePassword, isWelcomeBonusEligible,
} from '../src/index.js';

const NB = ' ';

test('formatage des montants', () => {
  assert.equal(formatFCFA(25000), `25${NB}000${NB}FCFA`);
  assert.equal(formatFCFA(1000000), `1${NB}000${NB}000${NB}FCFA`);
  assert.equal(formatSigned(5000), `+5${NB}000`);
  assert.equal(formatSigned(-2000), `−2${NB}000`);
  assert.equal(parseAmount('5 000 FCFA'), 5000);
  assert.equal(parseAmount(''), null);
});

test('numéros togolais', () => {
  assert.deepEqual(normalizeTogoPhone('90 12 34 56'), { ok: true, e164: '+22890123456' });
  assert.deepEqual(normalizeTogoPhone('+228 96 12 34 56').e164, '+22896123456');
  assert.equal(normalizeTogoPhone('0022890123456').e164, '+22890123456');
  assert.equal(normalizeTogoPhone('9012345').code, 'PHONE_LENGTH');
  assert.equal(normalizeTogoPhone('50123456').code, 'PHONE_PREFIX');
  assert.equal(formatPhone('+22890123456'), '+228 90 12 34 56');
  assert.equal(maskPhone('+22890123456'), '+228 90 •• •• 56');
  assert.equal(guessOperator('90123456'), 'TMONEY');
  assert.equal(guessOperator('96123456'), 'FLOOZ');
  assert.equal(guessOperator('95123456'), null);
});

test('bonus de bienvenue', () => {
  assert.deepEqual(computeWelcomeBonus(5000, true), { amount: 5000, wagerRequired: 25000 });
  assert.deepEqual(computeWelcomeBonus(50000, true), { amount: 10000, wagerRequired: 50000 });
  assert.deepEqual(computeWelcomeBonus(5000, false), { amount: 0, wagerRequired: 0 });
});

test('références et profil', () => {
  assert.equal(makeReference('DEP', new Date('2026-10-14T09:00:00Z'), () => 0.77812), 'DEP-1014-77812');
  assert.equal(validateFullName('  Kossi   Amouzou ').value, 'Kossi Amouzou');
  assert.equal(validateFullName('Ko').ok, false);
  assert.equal(validateFullName('K0ssi').ok, false);
  assert.equal(validateReferralCode('kossi228').value, 'KOSSI228');
  assert.equal(validateReferralCode('').value, null);
  assert.equal(validateReferralCode('ab').ok, false);
  assert.equal(makeReferralCode('Éfua Mensah', () => 0.042), 'EFUA042');
  assert.equal(initials('Kossi Amouzou'), 'KA');
});

test('connexion par mot de passe : adresse technique et mot de passe', () => {
  assert.equal(phoneToAuthEmail('+22890123456'), '22890123456@joueurs.wynveo.app');
  assert.equal(authEmailToPhone('22890123456@joueurs.wynveo.app'), '+22890123456');
  assert.equal(authEmailToPhone('admin@wynveo.com'), null);
  assert.equal(authEmailToPhone('22890123456@joueurs-wynveo.app'), null);
  assert.equal(validatePassword('court1').code, 'PASSWORD_SHORT');
  assert.equal(validatePassword('motdepasse').code, 'PASSWORD_WEAK');
  assert.equal(validatePassword('12345678').code, 'PASSWORD_WEAK');
  assert.equal(validatePassword('lome2026').ok, true);
});

test('bonus seulement sur le premier dépôt depuis son propre numéro', () => {
  const w = createEmptyWallet();
  const other = applyDeposit(w, 5000, { fromOwnNumber: false });
  assert.equal(other.bonus.amount, 0, "pas de bonus depuis le numéro d'un autre");
  assert.equal(other.wallet.welcomeBonusGranted, false);
  assert.equal(isWelcomeBonusEligible(other.wallet, { fromOwnNumber: true }), true);
  const own = applyDeposit(other.wallet, 5000, { fromOwnNumber: true });
  assert.equal(own.bonus.amount, 5000);
  assert.equal(own.wallet.welcomeBonusGranted, true);
  assert.equal(applyDeposit(own.wallet, 5000, { fromOwnNumber: true }).bonus.amount, 0);
});

test('dépôt : limites et crédit avec bonus au premier dépôt seulement', () => {
  assert.equal(validateDepositAmount(100).code, 'AMOUNT_TOO_LOW');
  assert.equal(validateDepositAmount(5000).ok, true);
  assert.equal(validateDepositAmount(2_000_000).code, 'AMOUNT_TOO_HIGH');
  let w = createEmptyWallet();
  const first = applyDeposit(w, 5000, { fromOwnNumber: true });
  assert.equal(first.wallet.balance, 5000);
  assert.equal(first.wallet.bonusBalance, 5000);
  assert.equal(first.wallet.depositCount, 1);
  const second = applyDeposit(first.wallet, 20000, { fromOwnNumber: true });
  assert.equal(second.bonus.amount, 0);
  assert.equal(second.wallet.balance, 25000);
  assert.equal(second.wallet.totalDeposited, 25000);
});

test('retrait : numéro vérifié, solde, plafond sans KYC, mode de validation', () => {
  const today = '2026-10-14';
  const wallet = { ...createEmptyWallet(), balance: 80000, bonusBalance: 5000 };
  assert.equal(validateWithdrawal({ amount: 5000, wallet, kycStatus: 'verified', today, phoneVerified: false }).code, 'PHONE_UNVERIFIED');
  assert.equal(validateWithdrawal({ amount: 500, wallet, kycStatus: 'none', today, phoneVerified: true }).code, 'AMOUNT_TOO_LOW');
  assert.equal(validateWithdrawal({ amount: 90000, wallet, kycStatus: 'verified', today, phoneVerified: true }).code, 'INSUFFICIENT_FUNDS');
  assert.equal(validateWithdrawal({ amount: 60000, wallet, kycStatus: 'none', today, phoneVerified: true }).code, 'KYC_REQUIRED');
  assert.equal(validateWithdrawal({ amount: 60000, wallet, kycStatus: 'verified', today, phoneVerified: true }).ok, true);
  const already = { ...wallet, withdrawnToday: { date: today, amount: 40000 } };
  assert.equal(validateWithdrawal({ amount: 15000, wallet: already, kycStatus: 'none', today, phoneVerified: true }).code, 'KYC_REQUIRED');
  const yesterday = { ...wallet, withdrawnToday: { date: '2026-10-13', amount: 40000 } };
  assert.equal(validateWithdrawal({ amount: 15000, wallet: yesterday, kycStatus: 'none', today, phoneVerified: true }).ok, true);
  assert.equal(withdrawalReviewMode({ amount: 20000, kycStatus: 'verified' }), 'auto');
  assert.equal(withdrawalReviewMode({ amount: 20000, kycStatus: 'none' }), 'manual');
  assert.equal(withdrawalReviewMode({ amount: 30000, kycStatus: 'verified' }), 'manual');
});

test('retrait : mise de côté, remboursement, paiement', () => {
  const today = '2026-10-14';
  const w0 = { ...createEmptyWallet(), balance: 30000 };
  const held = applyWithdrawalHold(w0, 15000, today);
  assert.equal(held.balance, 15000);
  assert.deepEqual(held.withdrawnToday, { date: today, amount: 15000 });
  const refunded = applyWithdrawalRefund(held, 15000, today, today);
  assert.equal(refunded.balance, 30000);
  assert.equal(refunded.withdrawnToday.amount, 0);
  assert.equal(applyWithdrawalPaid(held, 15000).totalWithdrawn, 15000);
  assert.deepEqual(currentDailyCounter({ date: '2026-10-13', amount: 5 }, today), { date: today, amount: 0 });
  assert.equal(dayKey(new Date('2026-10-14T23:59:00Z')), '2026-10-14');
});

test('transactions : signe et filtres', () => {
  assert.equal(signedAmount({ type: 'withdrawal', amount: 15000 }), -15000);
  assert.equal(signedAmount({ type: 'deposit', amount: 5000 }), 5000);
  assert.equal(matchesHistoryFilter({ type: 'bonus' }, 'deposits'), true);
  assert.equal(matchesHistoryFilter({ type: 'bet', product: 'sport' }, 'games'), false);
});
