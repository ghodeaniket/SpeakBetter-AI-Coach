import { SpeechAnalysis } from '@speakbetter/core';

/**
 * Legacy Google Cloud Speech Service
 * @deprecated Use the new googleSpeechService implementation instead
 */
export class GoogleSpeechService {
  /**
   * Transcribe audio to text and analyze the speech
   * @param audioBlob The audio blob to transcribe
   * @param options Optional configuration for transcription
   * @deprecated Use the new googleSpeechService implementation instead
   */
  async transcribeAudio(
    audioBlob: Blob, 
    options?: {
      language?: string;
      enhancedModel?: boolean;
      wordTimestamps?: boolean;
    }
  ): Promise<any> {
    console.warn('GoogleSpeechService is deprecated. Use createGoogleSpeechService from googleSpeechService.ts instead');
    console.log('GoogleSpeechService.transcribeAudio() called - deprecated', { options });
    
    // Return stub data for now
    return {
      transcription: 'Stub transcription text',
      wordsPerMinute: 120,
      fillerWordCounts: {
        'um': 2,
        'uh': 1,
        'like': 3
      },
      fillerWordPercentage: 5.2,
      clarityScore: 85
    };
  }
  
  /**
   * Synthesize text to speech
   * @param text The text to synthesize
   * @param options Optional configuration for synthesis
   * @deprecated Use the new googleSpeechService implementation instead
   */
  async synthesizeSpeech(
    text: string, 
    options?: {
      voice?: string;
      pitch?: number;
      rate?: number;
      audioType?: 'mp3' | 'wav' | 'ogg';
    }
  ): Promise<ArrayBuffer> {
    console.warn('GoogleSpeechService is deprecated. Use createGoogleSpeechService from googleSpeechService.ts instead');
    console.log('GoogleSpeechService.synthesizeSpeech() called - deprecated', { text, options });
    
    // Return empty buffer for now
    return new ArrayBuffer(0);
  }
}

/**
 * Create a Google Speech service instance
 * @deprecated Use createGoogleSpeechService from googleSpeechService.ts instead
 */
export function createLegacyGoogleSpeechService(): GoogleSpeechService {
  console.warn('createGoogleSpeechService from googleSpeech.ts is deprecated. Use createGoogleSpeechService from googleSpeechService.ts instead');
  return new GoogleSpeechService();
}
