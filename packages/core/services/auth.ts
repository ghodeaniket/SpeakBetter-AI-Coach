/**
 * Authentication Service Interface
 * Provides authentication and user management functionality
 */

import { User, UserCredentials } from '../models/user';
import { AppError } from '../models/error';

/**
 * Authentication state listener callback
 */
export type AuthStateListener = (user: User | null) => void;

/**
 * Represents the user authentication state in the application
 */
export interface AuthState {
  /**
   * Current user or null if not signed in
   */
  user: User | null;
  
  /**
   * Whether authentication state is loading
   */
  loading: boolean;
  
  /**
   * Any authentication error
   */
  error: AppError | null;
}

/**
 * Authentication service interface
 * Platform-agnostic interface for authentication operations
 */
export interface AuthService {
  /**
   * Get the current authenticated user
   */
  getCurrentUser(): Promise<User | null>;
  
  /**
   * Sign in with email and password
   */
  signInWithEmailPassword(credentials: UserCredentials): Promise<User>;
  
  /**
   * Sign in with Google
   */
  signInWithGoogle(): Promise<User>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;
  
  /**
   * Create a user with email and password
   */
  createUserWithEmailPassword(credentials: UserCredentials): Promise<User>;
  
  /**
   * Send password reset email
   */
  sendPasswordResetEmail(email: string): Promise<void>;
  
  /**
   * Update user password
   */
  updatePassword(newPassword: string): Promise<void>;
  
  /**
   * Delete the current user
   */
  deleteUser(): Promise<void>;
  
  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(listener: AuthStateListener): () => void;
  
  /**
   * Get the current auth state
   */
  getAuthState(): AuthState;
  
  /**
   * Get authentication token
   */
  getIdToken(): Promise<string | null>;
  
  /**
   * Check if token needs refresh
   */
  isTokenExpired(): Promise<boolean>;
  
  /**
   * Verify user's email
   */
  sendEmailVerification(): Promise<void>;
}
