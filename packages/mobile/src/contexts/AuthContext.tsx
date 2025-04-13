import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, UserCredentials } from '@speakbetter/core';
import { FirebaseAuthAdapter } from '../adapters';
import { userProfileAdapter } from '../adapters';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (credentials: UserCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createAccount: (credentials: UserCredentials) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const authService = new FirebaseAuthAdapter();
  
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setLoading(false);
      setUser(authUser);
    });
    
    // Initial check for current user
    const checkCurrentUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
      } catch (error) {
        setError('Failed to get current user');
        setLoading(false);
      }
    };
    
    checkCurrentUser();
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, []);
  
  const signInWithEmail = async (credentials: UserCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const authUser = await authService.signInWithEmailPassword(credentials);
      setUser(authUser);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authUser = await authService.signInWithGoogle();
      setUser(authUser);
      
      // Check if this is a first-time sign-in
      const userProfile = await userProfileAdapter.getUserProfile(authUser.uid);
      
      if (!userProfile) {
        // Create new user profile for first-time Google sign-in
        await userProfileAdapter.createUserProfile(authUser);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error: any) {
      setError(error.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };
  
  const createAccount = async (credentials: UserCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the user with Firebase Auth
      const authUser = await authService.createUserWithEmailPassword(credentials);
      
      // Create a user profile in Firestore
      await userProfileAdapter.createUserProfile(authUser);
      
      setUser(authUser);
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  const sendPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.sendPasswordResetEmail(email);
      Alert.alert('Password Reset', 'Check your email for a password reset link');
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };
  
  const clearError = () => {
    setError(null);
  };
  
  const value = {
    user,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    createAccount,
    sendPasswordReset,
    clearError
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};