import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User } from '@speakbetter/core';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    user: null,
    isLoading: true,
    error: null,
    setUser: (user) => set((state) => { state.user = user; }),
    setLoading: (isLoading) => set((state) => { state.isLoading = isLoading; }),
    setError: (error) => set((state) => { state.error = error; }),
  }))
);

// Export hooks that use this store
export * from './hooks/useFirebaseAuth';