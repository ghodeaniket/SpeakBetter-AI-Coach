import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Session } from '@speakbetter/core';

interface SessionsState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: Error | null;
  
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useSessionsStore = create<SessionsState>()(
  immer((set) => ({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,
    
    setSessions: (sessions) => set((state) => { state.sessions = sessions; }),
    setCurrentSession: (session) => set((state) => { state.currentSession = session; }),
    addSession: (session) => set((state) => { state.sessions.push(session); }),
    updateSession: (sessionId, updates) => set((state) => {
      const index = state.sessions.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        state.sessions[index] = { ...state.sessions[index], ...updates };
      }
    }),
    removeSession: (sessionId) => set((state) => {
      const index = state.sessions.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        state.sessions.splice(index, 1);
      }
    }),
    setLoading: (isLoading) => set((state) => { state.isLoading = isLoading; }),
    setError: (error) => set((state) => { state.error = error; }),
  }))
);