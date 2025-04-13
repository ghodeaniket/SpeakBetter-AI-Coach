import { SpeechAnalysis } from '../models/analysis';

export interface TranscriptionOptions {
  audioBlob: Blob;
  languageCode?: string;
  enableWordTimestamps?: boolean;
}

export interface SpeechToTextService {
  transcribeAudio(options: TranscriptionOptions): Promise<SpeechAnalysis>;
  analyzeTranscription(transcription: string): SpeechAnalysis;
  getFillerWordStatistics(transcription: string): Record<string, number>;
  calculateSpeakingRate(transcription: string, durationSeconds: number): number;
  calculateClarityScore(analysis: Partial<SpeechAnalysis>): number;
}