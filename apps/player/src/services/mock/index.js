/**
 * Implémentation de démonstration des services, sans réseau.
 * Même interface que ../firebase et mêmes règles métier (@wynveo/core),
 * pour présenter l'application ou travailler sur l'interface hors ligne.
 * Les comptes et les mots de passe restent dans ce navigateur uniquement.
 */
import {
  createEmptyWallet, applyDeposit, applyWithdrawalHold, validateDepositAmount, validateWithdrawal,
  withdrawalReviewMode, validateFullName, validateReferralCode, makeReferralCode, normalizeTogoPhone,
  isOperator, makeReference, REF_PREFIX, TX_TYPE, TX_STATUS, dayKey, applyWithdrawalPaid, validatePassword,
} from '@wynveo/core';
import { AppError } from '../errors.js';
import { state, commit, subscribe, delay, newId } from './store.js';

const assertRule = (r) => { if (!r.ok) throw new AppError(r.code, r.message); return r; };
const findTx = (id) => state.transactions.find((t) => t.id === id);

function addTx(fields) {
  const tx = {
    id: newId(), product: null, operator: null, msisdn: null, balanceAfter: null, failureReason: null, label: null,
    createdAt: new Date(), updatedAt: new Date(), ...fields,
  };
  state.transactions.unshift(tx);
  return tx;
}

function activeUser(uid) {
  const user = state.users[uid];
  if (!user) throw new AppError('PROFILE_MISSING', 'Terminez votre inscription.');
  if (user.status !== 'active') throw new AppError('ACCOUNT_SUSPENDED', 'Votre compte est suspendu. Contactez le support.');
  return user;
}

const uid = () => {
  if (!state.session) throw new AppError('unauthenticated', 'Connectez-vous pour continuer.');
  return state.session.uid;
};

export const dataSource = 'mock';

/** Empreinte simple : suffisant pour une démo locale, jamais utilisé en production. */
const fingerprint = (pw) => Array.from(pw).reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7).toString(36);

export const authService = {
  onAuthChange(cb) {
    let last;
    return subscribe(() => {
      const key = state.session?.uid ?? null;
      if (key !== last) { last = key; cb(state.session ? { ...state.session } : null); }
    });
  },
  async signUp(e164, password) {
    await delay();
    state.accounts ??= {};
    if (state.accounts[e164]) throw new AppError('auth/email-already-in-use', 'Ce numéro a déjà un compte. Connectez-vous.');
    assertRule(validatePassword(password));
    const uidValue = `u-${e164.replace(/\D/g, '')}`;
    state.accounts[e164] = { uid: uidValue, pw: fingerprint(password) };
    state.session = { uid: uidValue, phone: e164 };
    commit();
  },
  async signIn(e164, password) {
    await delay();
    const acc = state.accounts?.[e164];
    if (!acc || acc.pw !== fingerprint(password)) throw new AppError('auth/invalid-credential', 'Numéro ou mot de passe incorrect.');
    state.session = { uid: acc.uid, phone: e164 };
    commit();
  },
  async signOut() { state.session = null; commit(); },
};

export const profileService = {
  watchProfile(id, cb) {
    return subscribe(() => {
      const u = state.users[id];
      cb(u ? { uid: id, ...u } : null);
    });
  },
  async completeProfile({ fullName, referralCode, ageConfirmed }) {
    await delay();
    const id = uid();
    const name = assertRule(validateFullName(fullName)).value;
    const referral = assertRule(validateReferralCode(referralCode)).value;
    if (!ageConfirmed) throw new AppError('AGE_REQUIRED', 'Vous devez avoir 18 ans ou plus pour jouer.');
    if (state.users[id]) return { created: false };
    const referredBy = referral ? Object.keys(state.users).find((k) => state.users[k].referralCode === referral) : null;
    if (referral && !referredBy) throw new AppError('REFERRAL_UNKNOWN', "Ce code parrain n'existe pas.");
    state.users[id] = {
      fullName: name, phone: state.session.phone, referralCode: makeReferralCode(name), referredBy: referredBy ?? null,
      phoneVerified: false, kycStatus: 'none', status: 'active', createdAt: new Date(),
    };
    state.wallets[id] = createEmptyWallet();
    commit();
    return { created: true };
  },
};

export const walletService = {
  watchWallet(id, cb) {
    return subscribe(() => cb({ ...(state.wallets[id] ?? createEmptyWallet()) }));
  },
  watchTransactions(id, { limit = 50 } = {}, cb) {
    return subscribe(() => cb(state.transactions.filter((t) => t.uid === id).slice(0, limit).map((t) => ({ ...t }))));
  },
  watchTransaction(txId, cb) {
    return subscribe(() => { const t = findTx(txId); if (t) cb({ ...t }); });
  },

  async createDeposit({ amount, operator, msisdn }) {
    await delay();
    const id = uid();
    activeUser(id);
    assertRule(validateDepositAmount(amount));
    if (!isOperator(operator)) throw new AppError('OPERATOR_INVALID', 'Choisissez un moyen de paiement.');
    const e164 = assertRule(normalizeTogoPhone(msisdn)).e164;
    const tx = addTx({
      uid: id, type: TX_TYPE.DEPOSIT, status: TX_STATUS.PENDING, amount, operator, msisdn: e164,
      reference: makeReference(REF_PREFIX.deposit), dayKey: dayKey(),
    });
    commit();
    return { txId: tx.id, reference: tx.reference, status: tx.status, allowsManualConfirmation: true };
  },

  async confirmSimulatedDeposit(txId) {
    await delay(900);
    const tx = findTx(txId);
    if (!tx || tx.uid !== uid()) throw new AppError('not-found', 'Opération introuvable.');
    if (tx.status !== TX_STATUS.PENDING) return { status: tx.status, alreadySettled: true };
    const user = state.users[tx.uid];
    const fromOwnNumber = tx.msisdn === user.phone;
    const { wallet, bonus } = applyDeposit(state.wallets[tx.uid], tx.amount, { fromOwnNumber });
    state.wallets[tx.uid] = wallet;
    if (fromOwnNumber) user.phoneVerified = true;
    Object.assign(tx, { status: TX_STATUS.SUCCESS, balanceAfter: wallet.balance, updatedAt: new Date() });
    if (bonus.amount > 0) {
      addTx({ uid: tx.uid, type: TX_TYPE.BONUS, status: TX_STATUS.SUCCESS, amount: bonus.amount, reference: makeReference(REF_PREFIX.bonus), label: 'Bonus de bienvenue' });
    }
    commit();
    return { status: TX_STATUS.SUCCESS, bonus: bonus.amount, balance: wallet.balance, phoneVerified: user.phoneVerified };
  },

  async cancelDeposit(txId) {
    await delay(300);
    const tx = findTx(txId);
    if (tx && tx.status === TX_STATUS.PENDING) {
      Object.assign(tx, { status: TX_STATUS.FAILED, failureReason: 'Annulé par le joueur.', updatedAt: new Date() });
      commit();
    }
    return { status: tx?.status };
  },

  async requestWithdrawal({ amount, operator }) {
    await delay();
    const id = uid();
    const user = activeUser(id);
    if (!isOperator(operator)) throw new AppError('OPERATOR_INVALID', 'Choisissez un moyen de paiement.');
    const today = dayKey();
    const wallet = state.wallets[id];
    assertRule(validateWithdrawal({ amount, wallet, kycStatus: user.kycStatus, today, phoneVerified: user.phoneVerified }));
    const mode = withdrawalReviewMode({ amount, kycStatus: user.kycStatus });
    let next = applyWithdrawalHold(wallet, amount, today);
    const status = mode === 'auto' ? TX_STATUS.SUCCESS : TX_STATUS.PENDING_REVIEW;
    if (status === TX_STATUS.SUCCESS) next = applyWithdrawalPaid(next, amount);
    state.wallets[id] = next;
    const tx = addTx({
      uid: id, type: TX_TYPE.WITHDRAWAL, status, amount, operator, msisdn: user.phone,
      reference: makeReference(REF_PREFIX.withdrawal), balanceAfter: next.balance, dayKey: today,
    });
    commit();
    return { txId: tx.id, reference: tx.reference, status };
  },
};
