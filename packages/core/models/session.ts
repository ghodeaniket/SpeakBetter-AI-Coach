/**
 * Session model definition
 * Contains all session-related types and interfaces
 */

/**
 * Enum for practice session types
 */
export enum SessionType {
  FREESTYLE = 'freestyle',
  GUIDED = 'guided',
  QA = 'qa'
}

/**
 * Enum for session status
 */
export enum SessionStatus {
  CREATED = 'created',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  ANALYZED = 'analyzed',
  FEEDBACK_READY = 'feedback_ready',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Session interface representing a practice session
 */
export interface Session {
  /**
   * Unique identifier for the session
   */
  id: string;
  
  /**
   * User ID that the session belongs to
   */
  userId: string;
  
  /**
   * Type of session
   */
  type: SessionType;
  
  /**
   * Session title or topic
   */
  title: string;
  
  /**
   * Current status of the session
   */
  status: SessionStatus;
  
  /**
   * URL to the recording file in storage
   */
  recordingUrl?: string;
  
  /**
   * Duration of the session in seconds
   */
  durationSeconds: number;
  
  /**
   * Timestamp when the session was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the session was last updated
   */
  updatedAt: Date;
  
  /**
   * Whether the session has been analyzed
   */
  hasAnalysis: boolean;
  
  /**
   * Whether feedback has been generated for the session
   */
  hasFeedback: boolean;
  
  /**
   * For guided sessions, the text that was read
   */
  guidedText?: string;
  
  /**
   * For Q&A sessions, the questions that were asked
   */
  qaQuestions?: string[];
  
  /**
   * Optional metadata for the session
   */
  metadata?: Record<string, any>;
}

/**
 * Session create request model
 * Used when creating a new session
 */
export interface SessionCreateRequest {
  userId: string;
  type: SessionType;
  title: string;
  guidedText?: string;
  qaQuestions?: string[];
  metadata?: Record<string, any>;
}

/**
 * Session update request model
 * Used when updating an existing session
 */
export interface SessionUpdateRequest {
  status?: SessionStatus;
  recordingUrl?: string;
  durationSeconds?: number;
  hasAnalysis?: boolean;
  hasFeedback?: boolean;
  metadata?: Record<string, any>;
}
