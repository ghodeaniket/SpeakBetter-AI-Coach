import { SpeechAnalysisResult } from '../models';

/**
 * Speech service interface
 * 
 * This service handles all speech-related functionality,
 * including speech-to-text and text-to-speech operations.
 */
export interface SpeechService {
  /**
   * Transcribe audio to text and analyze the speech
   * @param audioBlob The audio blob to transcribe
   * @param options Optional configuration for transcription
   * @returns A promise that resolves to the speech analysis result
   */
  transcribeAudio(
    audioBlob: Blob, 
    options?: {
      language?: string;
      enhancedModel?: boolean;
      wordTimestamps?: boolean;
    }
  ): Promise<SpeechAnalysisResult>;
  
  /**
   * Synthesize text to speech
   * @param text The text to synthesize
   * @param options Optional configuration for synthesis
   * @returns A promise that resolves to the audio data as an ArrayBuffer
   */
  synthesizeSpeech(
    text: string, 
    options?: {
      voice?: string;
      pitch?: number;
      rate?: number;
      audioType?: 'mp3' | 'wav' | 'ogg';
    }
  ): Promise<ArrayBuffer>;
}
