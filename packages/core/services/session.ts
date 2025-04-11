/**
 * Session Service Interface
 * Provides session management functionality
 */

import { Session, SessionCreateRequest, SessionUpdateRequest, SessionType, SessionStatus } from '../models/session';

/**
 * Session query options
 */
export interface SessionQueryOptions {
  /**
   * Maximum number of sessions to return
   */
  limit?: number;
  
  /**
   * Session type filter
   */
  type?: SessionType;
  
  /**
   * Session status filter
   */
  status?: SessionStatus;
  
  /**
   * Sort by field
   */
  sortBy?: keyof Session;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Start date for filtering
   */
  startDate?: Date;
  
  /**
   * End date for filtering
   */
  endDate?: Date;
  
  /**
   * Last session ID for pagination
   */
  startAfter?: string;
}

/**
 * Session service interface
 * Platform-agnostic interface for session operations
 */
export interface SessionService {
  /**
   * Get a session by ID
   */
  getSessionById(id: string): Promise<Session | null>;
  
  /**
   * Get sessions for a user
   */
  getUserSessions(userId: string, options?: SessionQueryOptions): Promise<Session[]>;
  
  /**
   * Create a new session
   */
  createSession(request: SessionCreateRequest): Promise<Session>;
  
  /**
   * Update an existing session
   */
  updateSession(id: string, request: SessionUpdateRequest): Promise<Session>;
  
  /**
   * Delete a session
   */
  deleteSession(id: string): Promise<void>;
  
  /**
   * Get the latest session for a user
   */
  getLatestSession(userId: string): Promise<Session | null>;
  
  /**
   * Count sessions for a user
   */
  countUserSessions(userId: string, options?: Omit<SessionQueryOptions, 'limit' | 'startAfter'>): Promise<number>;
  
  /**
   * Mark a session as having analysis
   */
  markSessionHasAnalysis(id: string): Promise<void>;
  
  /**
   * Mark a session as having feedback
   */
  markSessionHasFeedback(id: string): Promise<void>;
  
  /**
   * Update session status
   */
  updateSessionStatus(id: string, status: SessionStatus): Promise<void>;
  
  /**
   * Subscribe to session updates
   */
  onSessionUpdated(id: string, callback: (session: Session) => void): () => void;
}
