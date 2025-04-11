import { 
  AuthService, 
  AuthState, 
  AuthStateListener,
  User, 
  UserCredentials, 
  AppError 
} from '@speakbetter/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  getIdToken as firebaseGetIdToken,
  sendEmailVerification as firebaseSendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';

/**
 * Firebase authentication configuration
 */
export interface FirebaseAuthConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

/**
 * Converts a Firebase user to our application User model
 */
function convertFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
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
 * Firebase implementation of the AuthService interface
 */
export class FirebaseAuthService implements AuthService {
  private auth;
  private googleProvider;
  private currentAuthState: AuthState = {
    user: null,
    loading: true,
    error: null
  };
  
  constructor(config: FirebaseAuthConfig) {
    const app = initializeApp(config);
    this.auth = getAuth(app);
    this.googleProvider = new GoogleAuthProvider();
    
    // Initialize auth state
    firebaseOnAuthStateChanged(this.auth, 
      (user) => {
        if (user) {
          this.currentAuthState = {
            user: convertFirebaseUser(user),
            loading: false,
            error: null
          };
        } else {
          this.currentAuthState = {
            user: null,
            loading: false,
            error: null
          };
        }
      },
      (error) => {
        this.currentAuthState = {
          user: null,
          loading: false,
          error: {
            code: error.code || 'auth/unknown',
            message: error.message,
            originalError: error
          }
        };
      }
    );
  }
  
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.auth.currentUser) {
      return convertFirebaseUser(this.auth.currentUser);
    }
    return null;
  }
  
  /**
   * Sign in with email and password
   */
  async signInWithEmailPassword(credentials: UserCredentials): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
      return convertFirebaseUser(result.user);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      return convertFirebaseUser(result.user);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
      this.currentAuthState = {
        user: null,
        loading: false,
        error: null
      };
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Create a user with email and password
   */
  async createUserWithEmailPassword(credentials: UserCredentials): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, credentials.email, credentials.password);
      return convertFirebaseUser(result.user);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No authenticated user');
      }
      await firebaseUpdatePassword(this.auth.currentUser, newPassword);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Delete the current user
   */
  async deleteUser(): Promise<void> {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No authenticated user');
      }
      await firebaseDeleteUser(this.auth.currentUser);
      this.currentAuthState = {
        user: null,
        loading: false,
        error: null
      };
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
  
  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(listener: AuthStateListener): () => void {
    return firebaseOnAuthStateChanged(this.auth, 
      (user) => {
        if (user) {
          listener(convertFirebaseUser(user));
        } else {
          listener(null);
        }
      }
    );
  }
  
  /**
   * Get the current auth state
   */
  getAuthState(): AuthState {
    return this.currentAuthState;
  }
  
  /**
   * Get authentication token
   */
  async getIdToken(): Promise<string | null> {
    try {
      if (!this.auth.currentUser) {
        return null;
      }
      return await firebaseGetIdToken(this.auth.currentUser);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if token needs refresh
   */
  async isTokenExpired(): Promise<boolean> {
    // Firebase handles token refresh automatically
    // This is a placeholder for potential future use
    return false;
  }
  
  /**
   * Verify user's email
   */
  async sendEmailVerification(): Promise<void> {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No authenticated user');
      }
      await firebaseSendEmailVerification(this.auth.currentUser);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      this.currentAuthState = {
        ...this.currentAuthState,
        error: appError
      };
      throw appError;
    }
  }
}

/**
 * Create a Firebase authentication service instance
 */
export function createFirebaseAuthService(config: FirebaseAuthConfig): AuthService {
  return new FirebaseAuthService(config);
}
