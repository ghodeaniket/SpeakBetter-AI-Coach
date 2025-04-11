/**
 * Analysis model definition
 * Contains all speech analysis related types and interfaces
 */

/**
 * Word timing information from speech transcription
 */
export interface WordTiming {
  /**
   * The word that was spoken
   */
  word: string;
  
  /**
   * Start time of the word in seconds
   */
  startTime: number;
  
  /**
   * End time of the word in seconds
   */
  endTime: number;
  
  /**
   * Confidence score (0-1) from the speech recognition service
   */
  confidence?: number;
}

/**
 * Information about a detected filler word
 */
export interface FillerWordInstance {
  /**
   * The filler word that was detected
   */
  word: string;
  
  /**
   * Timestamp when the filler word occurred
   */
  timestamp: number;
}

/**
 * Metrics calculated from the speech analysis
 */
export interface SpeechMetrics {
  /**
   * Words per minute speaking rate
   */
  wordsPerMinute: number;
  
  /**
   * Total number of words spoken
   */
  totalWords: number;
  
  /**
   * Duration of the speech in seconds
   */
  durationSeconds: number;
  
  /**
   * Counts of each filler word detected
   */
  fillerWordCounts: Record<string, number>;
  
  /**
   * Total number of filler words detected
   */
  totalFillerWords: number;
  
  /**
   * Percentage of words that were filler words
   */
  fillerWordPercentage: number;
  
  /**
   * Overall clarity score (0-100)
   */
  clarityScore: number;
  
  /**
   * Average pause duration in seconds
   */
  avgPauseDuration?: number;
  
  /**
   * Pause frequency (pauses per minute)
   */
  pausesPerMinute?: number;
}

/**
 * Analysis interface representing a speech analysis result
 */
export interface Analysis {
  /**
   * Unique identifier for the analysis
   * Typically matches the session ID
   */
  id: string;
  
  /**
   * User ID that the analysis belongs to
   */
  userId: string;
  
  /**
   * Session ID that the analysis is for
   */
  sessionId: string;
  
  /**
   * Full transcription of the speech
   */
  transcription: string;
  
  /**
   * Calculated metrics from the analysis
   */
  metrics: SpeechMetrics;
  
  /**
   * Timing information for each word in the transcription
   */
  wordTimings: WordTiming[];
  
  /**
   * Instances of detected filler words
   */
  fillerInstances: FillerWordInstance[];
  
  /**
   * Timestamp when the analysis was created
   */
  createdAt: Date;
  
  /**
   * Optional analysis metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Analysis create request model
 * Used when creating a new analysis
 */
export interface AnalysisCreateRequest {
  userId: string;
  sessionId: string;
  transcription: string;
  metrics: SpeechMetrics;
  wordTimings: WordTiming[];
  fillerInstances: FillerWordInstance[];
  metadata?: Record<string, any>;
}

/**
 * Analysis update request model
 * Used when updating an existing analysis
 */
export interface AnalysisUpdateRequest {
  metrics?: Partial<SpeechMetrics>;
  metadata?: Record<string, any>;
}
