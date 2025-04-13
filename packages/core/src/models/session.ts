export interface Session {
  id: string;
  userId: string;
  type: 'freestyle' | 'guided' | 'qa';
  status: 'completed' | 'processing' | 'error';
  recordingUrl?: string;
  durationSeconds: number;
  createdAt: Date;
  hasAnalysis: boolean;
  hasFeedback: boolean;
}