import { FirebaseAuthService } from '../auth';
import { User } from '@speakbetter/core';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({})
}));

jest.mock('firebase/auth', () => {
  const mockUser = {
    uid: 'test-uid',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true,
    metadata: {
      creationTime: '2023-01-01T00:00:00Z',
      lastSignInTime: '2023-01-02T00:00:00Z'
    }
  };

  return {
    getAuth: jest.fn().mockReturnValue({
      currentUser: mockUser
    }),
    GoogleAuthProvider: jest.fn(),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockUser }),
    signInWithPopup: jest.fn().mockResolvedValue({ user: mockUser }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockUser }),
    signOut: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((auth, onNext, onError) => {
      // Call the callback with the mock user
      onNext(mockUser);
      // Return unsubscribe function
      return jest.fn();
    }),
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    sendEmailVerification: jest.fn().mockResolvedValue(undefined)
  };
});

describe('FirebaseAuthService', () => {
  const config = {
    apiKey: 'mock-api-key',
    authDomain: 'mock-auth-domain',
    projectId: 'mock-project-id'
  };
  
  let authService: FirebaseAuthService;
  
  beforeEach(() => {
    authService = new FirebaseAuthService(config);
  });
  
  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const user = await authService.getCurrentUser();
      
      expect(user).not.toBeNull();
      expect(user?.uid).toBe('test-uid');
      expect(user?.displayName).toBe('Test User');
      expect(user?.email).toBe('test@example.com');
    });
  });
  
  describe('signInWithEmailPassword', () => {
    it('should sign in with email and password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const user = await authService.signInWithEmailPassword(credentials);
      
      expect(user).not.toBeNull();
      expect(user.uid).toBe('test-uid');
      expect(user.email).toBe('test@example.com');
    });
  });
  
  describe('signInWithGoogle', () => {
    it('should sign in with Google', async () => {
      const user = await authService.signInWithGoogle();
      
      expect(user).not.toBeNull();
      expect(user.uid).toBe('test-uid');
      expect(user.email).toBe('test@example.com');
    });
  });
  
  describe('onAuthStateChanged', () => {
    it('should listen to auth state changes', () => {
      const mockListener = jest.fn();
      
      const unsubscribe = authService.onAuthStateChanged(mockListener);
      
      expect(mockListener).toHaveBeenCalled();
      expect(mockListener.mock.calls[0][0].uid).toBe('test-uid');
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });
  
  describe('getAuthState', () => {
    it('should return the current auth state', () => {
      const authState = authService.getAuthState();
      
      expect(authState).not.toBeNull();
      expect(authState.loading).toBe(false);
      expect(authState.error).toBeNull();
      expect(authState.user?.uid).toBe('test-uid');
    });
  });
});
