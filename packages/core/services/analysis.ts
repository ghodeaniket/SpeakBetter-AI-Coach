/**
 * Analysis Service Interface
 * Provides speech analysis functionality
 */

import { Analysis, AnalysisCreateRequest, AnalysisUpdateRequest, SpeechMetrics } from '../models/analysis';

/**
 * Analysis query options
 */
export interface AnalysisQueryOptions {
  /**
   * Maximum number of analyses to return
   */
  limit?: number;
  
  /**
   * Sort by field
   */
  sortBy?: keyof Analysis;
  
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
   * Last analysis ID for pagination
   */
  startAfter?: string;
}

/**
 * Analysis metrics calculation parameters
 */
export interface MetricsCalculationParams {
  /**
   * Transcription text
   */
  transcription: string;
  
  /**
   * Audio duration in seconds
   */
  durationSeconds: number;
  
  /**
   * Detected filler words
   */
  fillerWords: string[];
  
  /**
   * Word timings for advanced metrics
   */
  wordTimings?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
}

/**
 * Analysis service interface
 * Platform-agnostic interface for analysis operations
 */
export interface AnalysisService {
  /**
   * Get an analysis by ID
   */
  getAnalysisById(id: string): Promise<Analysis | null>;
  
  /**
   * Get analysis for a session
   */
  getAnalysisBySessionId(sessionId: string): Promise<Analysis | null>;
  
  /**
   * Get analyses for a user
   */
  getUserAnalyses(userId: string, options?: AnalysisQueryOptions): Promise<Analysis[]>;
  
  /**
   * Create a new analysis
   */
  createAnalysis(request: AnalysisCreateRequest): Promise<Analysis>;
  
  /**
   * Update an existing analysis
   */
  updateAnalysis(id: string, request: AnalysisUpdateRequest): Promise<Analysis>;
  
  /**
   * Delete an analysis
   */
  deleteAnalysis(id: string): Promise<void>;
  
  /**
   * Calculate speech metrics from transcription
   */
  calculateMetrics(params: MetricsCalculationParams): SpeechMetrics;
  
  /**
   * Detect filler words in a transcription
   */
  detectFillerWords(transcription: string): Array<{
    word: string;
    timestamp: number;
  }>;
  
  /**
   * Get user's improvement metrics over time
   */
  getUserImprovementMetrics(
    userId: string, 
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    date: Date;
    metrics: SpeechMetrics;
  }>>;
  
  /**
   * Get the user's average metrics
   */
  getUserAverageMetrics(userId: string): Promise<SpeechMetrics | null>;
  
  /**
   * Compare two analyses to identify improvements
   */
  compareAnalyses(
    firstAnalysisId: string,
    secondAnalysisId: string
  ): Promise<{
    improvements: Record<keyof SpeechMetrics, number>;
  }>;
}
