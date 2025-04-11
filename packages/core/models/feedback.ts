/**
 * Feedback model definition
 * Contains all feedback-related types and interfaces
 */

/**
 * Text feedback components
 */
export interface TextFeedback {
  /**
   * Positive observations about the speech
   */
  positive: string;
  
  /**
   * Areas identified for improvement
   */
  improvement: string;
  
  /**
   * Specific suggestions for improvement
   */
  suggestion: string;
  
  /**
   * Encouraging closing message
   */
  encouragement: string;
}

/**
 * Feedback interface representing coaching feedback
 */
export interface Feedback {
  /**
   * Unique identifier for the feedback
   * Typically matches the session ID
   */
  id: string;
  
  /**
   * User ID that the feedback belongs to
   */
  userId: string;
  
  /**
   * Session ID that the feedback is for
   */
  sessionId: string;
  
  /**
   * Analysis ID that the feedback is based on
   */
  analysisId: string;
  
  /**
   * Structured text feedback
   */
  textFeedback: TextFeedback;
  
  /**
   * URL to the audio feedback file
   */
  audioFeedbackUrl?: string;
  
  /**
   * Timestamp when the feedback was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the feedback was viewed by the user
   */
  viewedAt?: Date;
  
  /**
   * Rating given by the user for this feedback (1-5)
   */
  userRating?: number;
  
  /**
   * Optional feedback metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Feedback create request model
 * Used when creating new feedback
 */
export interface FeedbackCreateRequest {
  userId: string;
  sessionId: string;
  analysisId: string;
  textFeedback: TextFeedback;
  audioFeedbackUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Feedback update request model
 * Used when updating existing feedback
 */
export interface FeedbackUpdateRequest {
  textFeedback?: Partial<TextFeedback>;
  audioFeedbackUrl?: string;
  viewedAt?: Date;
  userRating?: number;
  metadata?: Record<string, any>;
}
