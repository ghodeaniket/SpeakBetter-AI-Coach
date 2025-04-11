// Model exports will go here
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface SessionMetadata {
  id: string;
  userId: string;
  type: 'freestyle' | 'guided' | 'qa';
  createdAt: Date;
  duration: number; // in seconds
}

export interface SpeechAnalysisResult {
  transcription: string;
  wordsPerMinute: number;
  fillerWordCounts: Record<string, number>;
  fillerWordPercentage: number;
  clarityScore: number;
}
