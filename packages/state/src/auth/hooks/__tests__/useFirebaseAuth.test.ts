import { useFirebaseAuth } from '../useFirebaseAuth';
import { useAuthStore } from '../../index';
import { User } from '@speakbetter/core';

// Mock React's useEffect and the auth store
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn) => fn()),
}));

jest.mock('../../index', () => ({
  useAuthStore: jest.fn(),
}));

describe('useFirebaseAuth', () => {
  // Mock user data
  const mockUser: User = {
    uid: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  // Mock auth service
  const mockAuthService = {
    getCurrentUser: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  };

  // Mock store implementation
  const mockSetUser = jest.fn();
  const mockSetLoading = jest.fn();
  const mockSetError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth store implementation
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      setUser: mockSetUser,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });
    
    // Default auth service mocks
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.onAuthStateChanged.mockImplementation(() => {
      return jest.fn(); // Return unsubscribe function
    });
  });

  it('should initialize by checking current user and setting up auth listener', async () => {
    // Mock getCurrentUser to return a user
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    
    // Call the hook
    useFirebaseAuth(mockAuthService);
    
    // Should set loading to true immediately
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Should call getCurrentUser
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    
    // Should set up auth state change listener
    expect(mockAuthService.onAuthStateChanged).toHaveBeenCalled();
    
    // Simulate async resolution
    await Promise.resolve();
    
    // Should set user and loading state after getCurrentUser resolves
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle errors when getting current user', async () => {
    const error = new Error('Auth error');
    mockAuthService.getCurrentUser.mockRejectedValue(error);
    
    // Call the hook
    useFirebaseAuth(mockAuthService);
    
    // Simulate async rejection
    await Promise.resolve().catch(() => {});
    
    // Should set error and loading state
    expect(mockSetError).toHaveBeenCalledWith(error);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should provide signInWithGoogle method that calls auth service', async () => {
    mockAuthService.signInWithGoogle.mockResolvedValue(mockUser);
    
    // Call the hook and get the returned methods
    const hook = useFirebaseAuth(mockAuthService);
    
    // Call the signInWithGoogle method
    const user = await hook.signInWithGoogle();
    
    // Verify result
    expect(user).toBe(mockUser);
    
    // Should set loading states correctly
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    
    // Should clear errors and set user
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
  });

  it('should handle errors when signing in with Google', async () => {
    const error = new Error('Sign in error');
    mockAuthService.signInWithGoogle.mockRejectedValue(error);
    
    // Call the hook and get the returned methods
    const hook = useFirebaseAuth(mockAuthService);
    
    // Call the signInWithGoogle method and expect it to throw
    await expect(hook.signInWithGoogle()).rejects.toThrow(error);
    
    // Should set loading states correctly
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    
    // Should set error
    expect(mockSetError).toHaveBeenCalledWith(error);
  });

  it('should provide signOut method that calls auth service', async () => {
    mockAuthService.signOut.mockResolvedValue(undefined);
    
    // Call the hook and get the returned methods
    const hook = useFirebaseAuth(mockAuthService);
    
    // Call the signOut method
    await hook.signOut();
    
    // Should set loading states correctly
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    
    // Should clear errors and set user to null
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });

  it('should handle errors when signing out', async () => {
    const error = new Error('Sign out error');
    mockAuthService.signOut.mockRejectedValue(error);
    
    // Call the hook and get the returned methods
    const hook = useFirebaseAuth(mockAuthService);
    
    // Call the signOut method and expect it to throw
    await expect(hook.signOut()).rejects.toThrow(error);
    
    // Should set loading states correctly
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    
    // Should set error
    expect(mockSetError).toHaveBeenCalledWith(error);
  });
});