import { SpeechAnalysis } from '../models/analysis';

export interface FeedbackContent {
  positive: string;
  improvement: string;
  suggestion: string;
  encouragement: string;
}

export interface Feedback {
  id: string;
  userId: string;
  analysisId: string;
  sessionId: string;
  textFeedback: FeedbackContent;
  audioFeedbackUrl?: string;
  createdAt: Date;
  viewedAt?: Date;
}

export interface FeedbackService {
  generateFeedback(analysis: SpeechAnalysis): Promise<Feedback>;
  generateAudioFeedback(feedbackText: string): Promise<string>; // Returns URL to audio file
  getFeedbackForSession(sessionId: string): Promise<Feedback | null>;
  markFeedbackAsViewed(feedbackId: string): Promise<void>;
}