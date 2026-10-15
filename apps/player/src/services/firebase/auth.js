import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase.js';

export const playerAuthService = {
  onAuthChange(cb) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        cb(null);
      } else {
        const doc = await db.collection('users').doc(user.uid).get();
        cb({ uid: user.uid, email: user.email, ...doc.data() });
      }
    });
  },

  async signIn(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const doc = await db.collection('users').doc(result.user.uid).get();
    return { uid: result.user.uid, email: result.user.email, ...doc.data() };
  },

  async signUp(email, password, { fullName, phone }) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
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
    await fbSignOut(auth);
  },
};
