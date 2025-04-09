import { useState, useEffect, useCallback } from 'react';
import { 
  createSession, 
  updateSession, 
  getSession, 
  getUserSessions, 
  deleteSession,
  uploadSessionRecording,
  Session
} from '../services/sessionService';

interface UseSessionManagementProps {
  userId: string | null;
}

interface UseSessionManagementReturn {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  createNewSession: (sessionType: 'freestyle' | 'guided' | 'qa') => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  loadUserSessions: () => Promise<void>;
  updateSessionData: (sessionId: string, data: Partial<Omit<Session, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;
  uploadRecording: (sessionId: string, audioBlob: Blob, durationSeconds: number) => Promise<string>;
}

// Create no-op implementations for when userId is null
const noOpFunctions = {
  createNewSession: async () => { throw new Error('User must be logged in'); },
  loadSession: async () => { throw new Error('User must be logged in'); },
  loadUserSessions: async () => {},
  updateSessionData: async () => { throw new Error('User must be logged in'); },
  removeSession: async () => { throw new Error('User must be logged in'); },
  uploadRecording: async () => { throw new Error('User must be logged in'); }
};

/**
 * Hook for managing session data
 * @param userId The user ID for fetching and managing sessions
 * @returns Functions and state for session management
 */
export const useSessionManagement = ({ userId }: UseSessionManagementProps): UseSessionManagementReturn => {
  // Return default no-op implementation when no userId
  if (!userId) {
    return {
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      ...noOpFunctions
    };
  }

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error state when resuming operations
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Define loadSession first since it's used by createNewSession
  const loadSession = useCallback(async (sessionId: string): Promise<void> => {
    clearError();
    setIsLoading(true);
    
    try {
      const session = await getSession(sessionId);
      setCurrentSession(session);
      
      if (!session) {
        setError('Session not found');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Load all sessions for the current user
  const loadUserSessions = useCallback(async (): Promise<void> => {
    clearError();
    setIsLoading(true);
    
    try {
      const userSessions = await getUserSessions(userId);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Check if this is a Firebase index error
      const errorStr = String(error);
      if (errorStr.includes('requires an index')) {
        setError('Database index is being created. Please try again in a few minutes or refresh the page.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load sessions';
        setError(errorMessage);
      }
      // Return empty sessions instead of throwing
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearError]);

  // Create a new session (uses loadSession and loadUserSessions)
  const createNewSession = useCallback(async (sessionType: 'freestyle' | 'guided' | 'qa'): Promise<string> => {
    clearError();
    setIsLoading(true);
    
    try {
      const sessionId = await createSession(userId, sessionType);
      
      try {
        // Try to load the session, but don't fail if it doesn't work
        await loadSession(sessionId);
      } catch (error) {
        console.warn('Could not load newly created session:', error);
        // Continue anyway
      }
      
      try {
        // Try to refresh the sessions list, but don't fail if it doesn't work
        await loadUserSessions();
      } catch (error) {
        console.warn('Could not refresh sessions list:', error);
        // Continue anyway
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      // Check if this is a Firebase index error
      const errorStr = String(error);
      if (errorStr.includes('requires an index')) {
        setError('Database index is being created. Please try again in a few minutes or refresh the page.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
        setError(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearError, loadSession, loadUserSessions]);

  // Update session data
  const updateSessionData = useCallback(async (
    sessionId: string, 
    data: Partial<Omit<Session, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> => {
    clearError();
    setIsLoading(true);
    
    try {
      await updateSession(sessionId, data);
      
      // Refresh the current session if it's the one being updated
      if (currentSession?.id === sessionId) {
        await loadSession(sessionId);
      }
      
      // Refresh the session list
      await loadUserSessions();
    } catch (error) {
      console.error('Failed to update session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update session';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clearError, currentSession, loadSession, loadUserSessions]);

  // Delete a session
  const removeSession = useCallback(async (sessionId: string): Promise<void> => {
    clearError();
    setIsLoading(true);
    
    try {
      await deleteSession(sessionId, userId);
      
      // Clear the current session if it's the one being deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      
      // Refresh the session list
      await loadUserSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearError, currentSession, loadUserSessions]);

  // Upload a recording for a session
  const uploadRecording = useCallback(async (
    sessionId: string, 
    audioBlob: Blob, 
    durationSeconds: number
  ): Promise<string> => {
    clearError();
    setIsLoading(true);
    
    try {
      const downloadURL = await uploadSessionRecording(sessionId, userId, audioBlob, durationSeconds);
      
      // Refresh the current session and session list
      await loadSession(sessionId);
      await loadUserSessions();
      
      return downloadURL;
    } catch (error) {
      console.error('Failed to upload recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload recording';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearError, loadSession, loadUserSessions]);

  // Load sessions when userId changes
  useEffect(() => {
    if (userId) {
      loadUserSessions().catch(console.error);
    } else {
      setSessions([]);
      setCurrentSession(null);
    }
  }, [userId, loadUserSessions]);

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    createNewSession,
    loadSession,
    loadUserSessions,
    updateSessionData,
    removeSession,
    uploadRecording
  };
};
