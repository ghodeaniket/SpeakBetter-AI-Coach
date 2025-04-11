import { User } from '../models';

/**
 * Authentication service interface
 * 
 * This service handles all authentication-related functionality,
 * including user sign-in, sign-out, and authentication state.
 */
export interface AuthService {
  /**
   * Sign in a user with the configured authentication provider
   * @returns A promise that resolves to the authenticated user or null if sign-in failed
   */
  signIn(): Promise<User | null>;
  
  /**
   * Sign out the current user
   * @returns A promise that resolves when sign-out is complete
   */
  signOut(): Promise<void>;
  
  /**
   * Get the currently authenticated user
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): User | null;
  
  /**
   * Subscribe to authentication state changes
   * @param callback A function that will be called whenever auth state changes
   * @returns A function that can be called to unsubscribe
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
