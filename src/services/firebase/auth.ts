import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp, 
  DocumentSnapshot
} from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  goals?: {
    type?: string;
    focus?: string[];
  };
  settings?: {
    voicePreference?: string;
    showAdvancedMetrics?: boolean;
  };
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get current user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return convertUserDocToProfile(userDoc);
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create or update user profile in Firestore
 */
export const updateUserProfile = async (
  uid: string, 
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Create new user profile in Firestore
 */
export const createUserProfile = async (user: User): Promise<UserProfile> => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    
    const newUserData = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    
    await setDoc(userDocRef, newUserData);
    
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Helper function to convert Firestore document to UserProfile
 */
const convertUserDocToProfile = (doc: DocumentSnapshot): UserProfile | null => {
  if (!doc.exists()) {
    return null;
  }
  
  const data = doc.data();
  
  return {
    uid: doc.id,
    displayName: data.displayName || null,
    email: data.email || null,
    photoURL: data.photoURL || null,
    createdAt: convertTimestampToDate(data.createdAt),
    lastLoginAt: convertTimestampToDate(data.lastLoginAt),
    goals: data.goals || undefined,
    settings: data.settings || undefined,
  };
};

/**
 * Helper function to convert Firestore timestamp to Date
 */
const convertTimestampToDate = (timestamp: Timestamp | undefined): Date => {
  if (!timestamp) {
    return new Date();
  }
  
  return timestamp.toDate();
};

export default {
  signInWithGoogle,
  signOutUser,
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  subscribeToAuthChanges
};
