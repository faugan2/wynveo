import { auth, db } from '../../config/firebase.js';

// Validate Firebase is configured
if (!auth || !db) {
  throw new Error('Firebase auth service requires VITE_DATA_SOURCE=firebase and valid Firebase credentials in .env');
}

export const playerAuthService = {
  onAuthChange(cb) {
    return auth.onAuthStateChanged(async (user) => {
      if (!user) {
        cb(null);
      } else {
        const doc = await db.collection('users').doc(user.uid).get();
        cb({ uid: user.uid, email: user.email, ...doc.data() });
      }
    });
  },

  async signIn(email, password) {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection('users').doc(result.user.uid).get();
    return { uid: result.user.uid, email: result.user.email, ...doc.data() };
  },

  async signUp(email, password, { fullName, phone }) {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(result.user.uid).set({
      fullName,
      phone,
      email,
      createdAt: new Date(),
      kycStatus: 'none',
      status: 'active',
    });
    return { uid: result.user.uid, email, fullName, phone };
  },

  async signOut() {
    await auth.signOut();
  },
};
