/**
 * Web Auth Service
 * Implements auth service for the web platform using Firebase
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  IdTokenResult,
} from 'firebase/auth';

import {
  AuthService,
  AuthState,
  AuthStateListener
} from '@speakbetter/core/services';
import {
  User,
  UserCredentials
} from '@speakbetter/core/models/user';
import {
  AppError,
  ErrorCategory,
  createAppError,
  ErrorCodes
} from '@speakbetter/core/models/error';

/**
 * Firebase configuration
 * This would normally come from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

/**
 * Convert Firebase user to application User model
 */
function mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    createdAt: new Date(Number(firebaseUser.metadata.creationTime)),
    lastLoginAt: new Date(Number(firebaseUser.metadata.lastSignInTime)),
    settings: {
      selectedVoice: 'default',
      coachPersonality: 'supportive',
      notificationPreferences: {
        email: true,
        inApp: true,
        practiceDays: ['monday', 'wednesday', 'friday']
      }
    }
  };
}

/**
 * Web implementation of the Auth Service
 * Uses Firebase Authentication for web platform
 */
export class WebAuthService implements AuthService {
  private app;
  private auth;
  private googleProvider;
  private authState: AuthState = {
    user: null,
    loading: true,
    error: null
  };
  
  constructor() {
    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.googleProvider = new GoogleAuthProvider();
    
    // Set up auth state listener
    firebaseOnAuthStateChanged(
      this.auth,
      (user) => {
        this.authState = {
          user: user ? mapFirebaseUserToUser(user) : null,
          loading: false,
          error: null
        };
      },
      (error) => {
        this.authState = {
          user: null,
          loading: false,
          error: this.mapFirebaseErrorToAppError(error)
        };
      }
    );
  }
  
  /**
   * Map Firebase error to AppError
   */
  private mapFirebaseErrorToAppError(error: any): AppError {
    const errorCode = error.code || ErrorCodes.UNKNOWN_ERROR;
    let message = error.message || 'An unknown error occurred';
    let category = ErrorCategory.AUTHENTICATION;
    
    // Clean up Firebase error message
    message = message.replace('Firebase: ', '').replace(/\\(.*?\\)$/, '');
    
    return createAppError(errorCode, message, {
      category,
      details: `Firebase auth error: ${error.code}`,
      originalError: error,
      recoverable: true
    });
  }
  
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    return this.authState.user;
  }
  
  /**
   * Sign in with email and password
   */
  async signInWithEmailPassword(credentials: UserCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      
      return mapFirebaseUserToUser(userCredential.user);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const userCredential = await signInWithPopup(this.auth, this.googleProvider);
      return mapFirebaseUserToUser(userCredential.user);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Create a user with email and password
   */
  async createUserWithEmailPassword(credentials: UserCredentials): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      
      return mapFirebaseUserToUser(userCredential.user);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw createAppError(
          ErrorCodes.AUTH_USER_NOT_FOUND,
          'No authenticated user found',
          { category: ErrorCategory.AUTHENTICATION }
        );
      }
      
      await firebaseUpdatePassword(user, newPassword);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Delete the current user
   */
  async deleteUser(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw createAppError(
          ErrorCodes.AUTH_USER_NOT_FOUND,
          'No authenticated user found',
          { category: ErrorCategory.AUTHENTICATION }
        );
      }
      
      await firebaseDeleteUser(user);
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(listener: AuthStateListener): () => void {
    return firebaseOnAuthStateChanged(
      this.auth,
      (user) => {
        listener(user ? mapFirebaseUserToUser(user) : null);
      }
    );
  }
  
  /**
   * Get the current auth state
   */
  getAuthState(): AuthState {
    return this.authState;
  }
  
  /**
   * Get authentication token
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Check if token needs refresh
   */
  async isTokenExpired(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return true;
    
    try {
      const tokenResult: IdTokenResult = await user.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime).getTime();
      const now = Date.now();
      
      // Consider token expired if it's within 5 minutes of expiration
      return expirationTime - now < 5 * 60 * 1000;
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
  
  /**
   * Verify user's email
   */
  async sendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw createAppError(
        ErrorCodes.AUTH_USER_NOT_FOUND,
        'No authenticated user found',
        { category: ErrorCategory.AUTHENTICATION }
      );
    }
    
    try {
      await user.sendEmailVerification();
    } catch (error) {
      throw this.mapFirebaseErrorToAppError(error);
    }
  }
}
