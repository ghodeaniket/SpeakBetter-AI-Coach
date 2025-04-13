export interface SpeechAnalysis {
  id: string;
  sessionId: string;
  userId: string;
  transcription: string;
  metrics: SpeechMetrics;
  wordTimings?: WordTiming[];
  fillerInstances?: FillerInstance[];
  timestamp: Date;
}

export interface SpeechMetrics {
  wordsPerMinute: number;
  totalWords: number;
  durationSeconds: number;
  fillerWordCounts: Record<string, number>;
  totalFillerWords: number;
  fillerWordPercentage: number;
  clarityScore: number;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface FillerInstance {
  word: string;
  timestamp: number;
}