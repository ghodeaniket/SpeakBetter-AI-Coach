import { AuthService, User } from '@speakbetter/core';

/**
 * Firebase implementation of the AuthService interface
 */
export class FirebaseAuthService implements AuthService {
  /**
   * Sign in a user with Firebase Authentication
   * @returns A promise that resolves to the authenticated user or null
   */
  async signIn(): Promise<User | null> {
    // To be implemented in Phase 2
    console.log('FirebaseAuthService.signIn() called - to be implemented');
    return null;
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    // To be implemented in Phase 2
    console.log('FirebaseAuthService.signOut() called - to be implemented');
  }
  
  /**
   * Get the currently authenticated user
   */
  getCurrentUser(): User | null {
    // To be implemented in Phase 2
    console.log('FirebaseAuthService.getCurrentUser() called - to be implemented');
    return null;
  }
  
  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // To be implemented in Phase 2
    console.log('FirebaseAuthService.onAuthStateChanged() called - to be implemented');
    return () => {
      // Unsubscribe function
    };
  }
}

/**
 * Create a Firebase authentication service instance
 */
export function createFirebaseAuthService(): AuthService {
  return new FirebaseAuthService();
}
