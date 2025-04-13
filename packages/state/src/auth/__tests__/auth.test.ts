import { useAuthStore } from '..';
import { User } from '@speakbetter/core';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isLoading: true,
      error: null,
      setUser: useAuthStore.getState().setUser,
      setLoading: useAuthStore.getState().setLoading,
      setError: useAuthStore.getState().setError,
    });
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set user', () => {
    const mockUser: User = {
      uid: '123',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('should set loading state', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should set error', () => {
    const error = new Error('Test error');
    useAuthStore.getState().setError(error);
    expect(useAuthStore.getState().error).toEqual(error);
  });
});