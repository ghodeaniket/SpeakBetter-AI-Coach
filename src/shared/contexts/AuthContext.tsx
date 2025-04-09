import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../firebase';

// Define the user profile shape
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

// Define the auth context shape
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Handle user profile data
  const fetchUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, update profile with server data
        const userData = userDoc.data() as Omit<UserProfile, 'uid'>;
        setUserProfile({
          uid: user.uid,
          ...userData,
          // Convert timestamps to dates
          createdAt: userData.createdAt ? new Date(userData.createdAt.toDate()) : new Date(),
          lastLoginAt: new Date(),
        });

        // Update last login time
        await setDoc(userDocRef, {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      } else {
        // New user, create profile
        const newUserProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };

        await setDoc(userDocRef, {
          displayName: newUserProfile.displayName,
          email: newUserProfile.email,
          photoURL: newUserProfile.photoURL,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        setUserProfile(newUserProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Error fetching user profile'));
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    try {
      setError(null);
      // Use the pre-configured googleProvider
      const { browserPopupRedirectResolver } = await import('firebase/auth');
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      
      // User profile will be updated by the auth state listener
      await fetchUserProfile(result.user);
      return userProfile;
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(err instanceof Error ? err : new Error('Error signing in with Google'));
      return null;
    }
  };

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err : new Error('Error signing out'));
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) {
      throw new Error('No user is signed in');
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Remove properties that should not be directly updated
      const { uid, createdAt, ...updatableData } = data;
      
      await setDoc(userDocRef, {
        ...updatableData,
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  const value = {
    currentUser,
    userProfile,
    isLoading,
    error,
    signInWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
