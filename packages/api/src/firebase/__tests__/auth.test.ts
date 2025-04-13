import { createFirebaseAuthService } from '../auth';
import { AuthService } from '@speakbetter/core';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({})
}));

jest.mock('firebase/auth', () => {
  const mockFirebaseUser = {
    uid: 'test-uid',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    metadata: {
      creationTime: '2023-01-01T00:00:00Z',
      lastSignInTime: '2023-01-02T00:00:00Z'
    }
  };

  return {
    getAuth: jest.fn().mockReturnValue({
      currentUser: mockFirebaseUser
    }),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
    signInWithPopup: jest.fn().mockResolvedValue({ user: mockFirebaseUser }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn().mockImplementation((auth, callback) => {
      callback(mockFirebaseUser);
      return () => {}; // Unsubscribe function
    })
  };
});

describe('FirebaseAuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    authService = createFirebaseAuthService({
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id'
    });
  });
  
  it('should get current user', async () => {
    const user = await authService.getCurrentUser();
    
    expect(user).toEqual({
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      createdAt: expect.any(Date),
      lastLoginAt: expect.any(Date)
    });
  });
  
  it('should sign in with Google', async () => {
    const user = await authService.signInWithGoogle();
    
    expect(user).toEqual({
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      createdAt: expect.any(Date),
      lastLoginAt: expect.any(Date)
    });
  });
  
  it('should sign out', async () => {
    await expect(authService.signOut()).resolves.toBeUndefined();
  });
  
  it('should subscribe to auth state changes', () => {
    const callback = jest.fn();
    const unsubscribe = authService.onAuthStateChanged(callback);
    
    expect(callback).toHaveBeenCalledWith({
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      createdAt: expect.any(Date),
      lastLoginAt: expect.any(Date)
    });
    
    expect(typeof unsubscribe).toBe('function');
  });
});
