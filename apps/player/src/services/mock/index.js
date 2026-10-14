/**
 * Implémentation de démonstration des services, sans réseau.
 * Même interface que ../firebase et mêmes règles métier (@wynveo/core),
 * pour présenter l'application ou travailler sur l'interface hors ligne.
 * Code SMS de démo : 123456.
 */
import {
  createEmptyWallet, applyDeposit, applyWithdrawalHold, validateDepositAmount, validateWithdrawal,
  withdrawalReviewMode, validateFullName, validateReferralCode, makeReferralCode, normalizeTogoPhone,
  isOperator, makeReference, REF_PREFIX, TX_TYPE, TX_STATUS, dayKey, applyWithdrawalPaid,
} from '@wynveo/core';
import { AppError } from '../errors.js';
import { state, commit, subscribe, delay, newId } from './store.js';

const DEMO_CODE = '123456';
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

export const authService = {
  onAuthChange(cb) {
    let last;
    return subscribe(() => {
      const key = state.session?.uid ?? null;
      if (key !== last) { last = key; cb(state.session ? { ...state.session } : null); }
    });
  },
  async startPhoneSignIn(e164) {
    await delay();
    return {
      async confirm(code) {
        await delay();
        if (code !== DEMO_CODE) throw new AppError('auth/invalid-verification-code', 'Code incorrect. En démo, le code est 123456.');
        state.session = { uid: `u-${e164.replace(/\D/g, '')}`, phone: e164 };
        commit();
      },
    };
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
      kycStatus: 'none', status: 'active', createdAt: new Date(),
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
    const { wallet, bonus } = applyDeposit(state.wallets[tx.uid], tx.amount);
    state.wallets[tx.uid] = wallet;
    Object.assign(tx, { status: TX_STATUS.SUCCESS, balanceAfter: wallet.balance, updatedAt: new Date() });
    if (bonus.amount > 0) {
      addTx({ uid: tx.uid, type: TX_TYPE.BONUS, status: TX_STATUS.SUCCESS, amount: bonus.amount, reference: makeReference(REF_PREFIX.bonus), label: 'Bonus de bienvenue' });
    }
    commit();
    return { status: TX_STATUS.SUCCESS, bonus: bonus.amount, balance: wallet.balance };
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
    assertRule(validateWithdrawal({ amount, wallet, kycStatus: user.kycStatus, today }));
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
