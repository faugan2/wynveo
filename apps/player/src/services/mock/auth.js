const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let session = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const sub = (fn) => { listeners.add(fn); fn(); return () => listeners.delete(fn); };

export const playerAuthService = {
  onAuthChange(cb) {
    return sub(() => {
      if (session) {
        cb(session);
      } else {
        cb(null);
      }
    });
  },

  async signIn(email, password) {
    await delay();
    if (email === 'joueur@wynveo.com' && password === 'demo1234') {
      session = { uid: 'p1', email, fullName: 'Jean Dupont', phone: '+228 91 44 21 08' };
      emit();
      return session;
    }
    throw new Error('E-mail ou mot de passe incorrect.');
  },

  async signUp(email, password, { fullName, phone }) {
    await delay();
    session = { uid: `u_${Math.random().toString(36).slice(2, 9)}`, email, fullName, phone };
    emit();
    return session;
  },

  async signOut() {
    await delay();
    session = null;
    emit();
  },
};
