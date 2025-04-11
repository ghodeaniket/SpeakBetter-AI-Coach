/**
 * Speech Service Interface
 * Provides speech-to-text and text-to-speech functionality
 * 
 * Implementation Notes:
 * - Web: Uses Web Speech API with fallback to Google Cloud Speech API
 * - Mobile: Should use platform-specific APIs (React Native Voice for iOS/Android)
 * - Consider caching TTS results for frequently used phrases
 * - Handle permission models differently across platforms
 * - Implement interrupt/resume capability for long-running operations
 */

import { AppError } from '../models/error';
import { WordTiming } from '../models/analysis';

/**
 * Transcription options
 */
export interface TranscriptionOptions {
  /**
   * Audio file to transcribe
   */
  audioFile: Blob | File | ArrayBuffer;
  
  /**
   * Audio content type
   */
  contentType?: string;
  
  /**
   * Language code (e.g., 'en-US')
   */
  languageCode?: string;
  
  /**
   * Whether to enable profanity filtering
   */
  profanityFilter?: boolean;
  
  /**
   * Whether to enhance the model for speech with background noise
   */
  enhancedModel?: boolean;
  
  /**
   * Maximum number of alternatives to return
   */
  maxAlternatives?: number;
  
  /**
   * Words to boost recognition for
   */
  speechContexts?: string[];
  
  /**
   * Progress callback
   */
  onProgress?: (progress: number) => void;
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  /**
   * Transcribed text
   */
  text: string;
  
  /**
   * Confidence score (0-1)
   */
  confidence: number;
  
  /**
   * Alternative transcriptions
   */
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
  
  /**
   * Timing information for each word
   */
  wordTimings: WordTiming[];
  
  /**
   * Language detected
   */
  languageCode: string;
  
  /**
   * Duration of audio
   */
  durationSeconds: number;
}

/**
 * Speech synthesis options
 */
export interface SpeechSynthesisOptions {
  /**
   * Text to synthesize
   */
  text: string;
  
  /**
   * Voice ID or name
   */
  voiceId?: string;
  
  /**
   * Language code (e.g., 'en-US')
   */
  languageCode?: string;
  
  /**
   * Speaking rate (0.25 to 4.0)
   */
  speakingRate?: number;
  
  /**
   * Pitch (-20.0 to 20.0)
   */
  pitch?: number;
  
  /**
   * Volume gain (-96.0 to 16.0)
   */
  volumeGainDb?: number;
  
  /**
   * Whether to use a neural voice model
   */
  useNeural?: boolean;
  
  /**
   * Progress callback
   */
  onProgress?: (progress: number) => void;
}

/**
 * Available voice information
 */
export interface VoiceInfo {
  /**
   * Voice ID
   */
  id: string;
  
  /**
   * Voice name
   */
  name: string;
  
  /**
   * Language code (e.g., 'en-US')
   */
  languageCode: string;
  
  /**
   * Voice gender
   */
  gender: 'male' | 'female' | 'neutral';
  
  /**
   * Whether this is a neural voice
   */
  isNeural: boolean;
}

/**
 * Speech service interface
 * Platform-agnostic interface for speech operations
 */
export interface SpeechService {
  /**
   * Transcribe audio to text
   */
  transcribe(options: TranscriptionOptions): Promise<TranscriptionResult>;
  
  /**
   * Synthesize text to speech
   */
  synthesize(options: SpeechSynthesisOptions): Promise<Blob>;
  
  /**
   * Get available voices
   */
  getAvailableVoices(): Promise<VoiceInfo[]>;
  
  /**
   * Get voices for a specific language
   */
  getVoicesForLanguage(languageCode: string): Promise<VoiceInfo[]>;
  
  /**
   * Get voice by ID
   */
  getVoiceById(id: string): Promise<VoiceInfo | null>;
  
  /**
   * Cancel ongoing operations
   */
  cancel(): void;
  
  /**
   * Check if speech recognition is supported
   */
  isRecognitionSupported(): boolean;
  
  /**
   * Check if speech synthesis is supported
   */
  isSynthesisSupported(): boolean;
}
