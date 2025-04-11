/**
 * Feedback Service Interface
 * Provides coaching feedback functionality
 */

import { Feedback, FeedbackCreateRequest, FeedbackUpdateRequest, TextFeedback } from '../models/feedback';
import { Analysis } from '../models/analysis';
import { User } from '../models/user';
import { FocusArea } from '../models/goal';

/**
 * Feedback query options
 */
export interface FeedbackQueryOptions {
  /**
   * Maximum number of feedback items to return
   */
  limit?: number;
  
  /**
   * Sort by field
   */
  sortBy?: keyof Feedback;
  
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
   * Only include viewed feedback
   */
  viewed?: boolean;
  
  /**
   * Last feedback ID for pagination
   */
  startAfter?: string;
}

/**
 * Feedback generation parameters
 */
export interface FeedbackGenerationParams {
  /**
   * Analysis to generate feedback for
   */
  analysis: Analysis;
  
  /**
   * User receiving the feedback
   */
  user: User;
  
  /**
   * Focus areas the user is working on
   */
  focusAreas?: FocusArea[];
  
  /**
   * Whether this is guided practice
   */
  isGuided?: boolean;
  
  /**
   * Whether this is Q&A practice
   */
  isQA?: boolean;
  
  /**
   * Previous analyses for comparison
   */
  previousAnalyses?: Analysis[];
}

/**
 * Feedback service interface
 * Platform-agnostic interface for feedback operations
 */
export interface FeedbackService {
  /**
   * Get feedback by ID
   */
  getFeedbackById(id: string): Promise<Feedback | null>;
  
  /**
   * Get feedback for a session
   */
  getFeedbackBySessionId(sessionId: string): Promise<Feedback | null>;
  
  /**
   * Get feedback items for a user
   */
  getUserFeedback(userId: string, options?: FeedbackQueryOptions): Promise<Feedback[]>;
  
  /**
   * Create new feedback
   */
  createFeedback(request: FeedbackCreateRequest): Promise<Feedback>;
  
  /**
   * Update existing feedback
   */
  updateFeedback(id: string, request: FeedbackUpdateRequest): Promise<Feedback>;
  
  /**
   * Delete feedback
   */
  deleteFeedback(id: string): Promise<void>;
  
  /**
   * Mark feedback as viewed
   */
  markFeedbackViewed(id: string): Promise<void>;
  
  /**
   * Rate feedback
   */
  rateFeedback(id: string, rating: number): Promise<void>;
  
  /**
   * Generate text feedback from analysis
   */
  generateTextFeedback(params: FeedbackGenerationParams): Promise<TextFeedback>;
  
  /**
   * Generate audio feedback from text feedback
   */
  generateAudioFeedback(textFeedback: TextFeedback, voiceId?: string): Promise<string>;
  
  /**
   * Generate comprehensive feedback including text and audio
   */
  generateComprehensiveFeedback(params: FeedbackGenerationParams): Promise<{
    textFeedback: TextFeedback;
    audioFeedbackUrl: string;
  }>;
}
