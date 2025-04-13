import { useEffect } from 'react';
import { AuthService } from '@speakbetter/core';
import { useAuthStore } from '..';

export const useFirebaseAuth = (authService: AuthService) => {
  const { setUser, setLoading, setError } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    // Get current user on mount
    authService.getCurrentUser()
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });

    // Set up auth state change listener
    const unsubscribe = authService.onAuthStateChanged(user => {
      setUser(user);
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [authService, setUser, setLoading, setError]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signInWithGoogle();
      setUser(user);
      return user;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to sign in'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to sign out'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    ...useAuthStore(),
    signInWithGoogle,
    signOut,
  };
};