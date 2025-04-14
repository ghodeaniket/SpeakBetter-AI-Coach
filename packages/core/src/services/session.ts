import { Session } from '../models';

/**
 * Session service interface
 * 
 * This service handles all session-related functionality,
 * including creating, retrieving, updating, and deleting sessions.
 */
export interface SessionService {
  /**
   * Get all sessions for a user
   * @param userId The user ID to get sessions for
   * @param options Optional filtering and pagination options
   * @returns A promise that resolves to an array of session metadata
   */
  getSessions(
    userId: string, 
    options?: {
      limit?: number;
      offset?: number;
      type?: 'freestyle' | 'guided' | 'qa';
      sortBy?: 'createdAt' | 'duration';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<Session[]>;
  
  /**
   * Get a single session by ID
   * @param sessionId The session ID to get
   * @returns A promise that resolves to the session metadata or null if not found
   */
  getSession(sessionId: string): Promise<Session | null>;
  
  /**
   * Save a new session or update an existing one
   * @param session The session metadata to save
   * @returns A promise that resolves when the session is saved
   */
  saveSession(session: Session): Promise<void>;
  
  /**
   * Delete a session by ID
   * @param sessionId The session ID to delete
   * @returns A promise that resolves when the session is deleted
   */
  deleteSession(sessionId: string): Promise<void>;
}
