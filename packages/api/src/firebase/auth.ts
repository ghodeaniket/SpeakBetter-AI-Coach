import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { AuthService, User } from '@speakbetter/core';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const createFirebaseAuthService = (config: FirebaseConfig): AuthService => {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const mapFirebaseUser = (firebaseUser: FirebaseUser | null): User | null => {
    if (!firebaseUser) return null;
    
    return {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      createdAt: firebaseUser.metadata.creationTime 
        ? new Date(firebaseUser.metadata.creationTime) 
        : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime) 
        : new Date()
    };
  };

  return {
    getCurrentUser: async () => {
      return mapFirebaseUser(auth.currentUser);
    },
    
    signInWithGoogle: async () => {
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user) as User;
    },
    
    signOut: async () => {
      await firebaseSignOut(auth);
    },
    
    onAuthStateChanged: (callback) => {
      return onFirebaseAuthStateChanged(auth, (user) => {
        callback(mapFirebaseUser(user));
      });
    }
  };
};
