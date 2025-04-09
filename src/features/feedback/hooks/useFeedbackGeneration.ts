import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { 
  generateFeedback,
  saveFeedback,
  generateAudioFeedback,
  FeedbackTemplate
} from '../services/feedbackService';
import { TranscriptionResult } from '../../../services/google-cloud/speech';

interface UseFeedbackGenerationProps {
  transcriptionResult: TranscriptionResult | null;
  sessionId?: string;
  autoGenerate?: boolean;
  userGoals?: string[];
  preferredVoiceId?: string;
}

interface UseFeedbackGenerationReturn {
  feedback: FeedbackTemplate | null;
  audioUrl: string | null;
  isGenerating: boolean;
  isGeneratingAudio: boolean;
  feedbackId: string | null;
  generateFeedbackForSession: () => Promise<void>;
  generateAudioForFeedback: () => Promise<void>;
  error: Error | null;
}

/**
 * Custom hook for feedback generation
 */
export const useFeedbackGeneration = ({
  transcriptionResult,
  sessionId,
  autoGenerate = false,
  userGoals,
  preferredVoiceId
}: UseFeedbackGenerationProps): UseFeedbackGenerationReturn => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackTemplate | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Auto-generate feedback when transcriptionResult changes if autoGenerate is true
  useEffect(() => {
    if (autoGenerate && transcriptionResult && !feedback && !isGenerating) {
      generateFeedbackForSession();
    }
  }, [transcriptionResult, autoGenerate]);
  
  /**
   * Generate feedback for current session
   */
  const generateFeedbackForSession = async () => {
    if (!transcriptionResult) {
      setError(new Error('No transcription result available'));
      return;
    }
    
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Generate feedback based on transcription result
      const generatedFeedback = generateFeedback(transcriptionResult, userGoals);
      setFeedback(generatedFeedback);
      
      // If we have a sessionId, save the feedback
      if (sessionId) {
        const savedFeedbackId = await saveFeedback(
          generatedFeedback,
          sessionId,
          user.uid
        );
        setFeedbackId(savedFeedbackId);
        
        // Generate audio automatically
        await generateAudioForFeedback();
      }
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate feedback'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Generate audio for the current feedback
   */
  const generateAudioForFeedback = async () => {
    if (!feedback) {
      setError(new Error('No feedback available to generate audio'));
      return;
    }
    
    try {
      setIsGeneratingAudio(true);
      setError(null);
      
      // Generate audio for feedback
      const generatedAudioUrl = await generateAudioFeedback(feedback, preferredVoiceId);
      setAudioUrl(generatedAudioUrl);
      
      // If we have a feedbackId, update the feedback with the audio URL
      if (feedbackId && user) {
        await saveFeedback(feedback, sessionId || '', user.uid, generatedAudioUrl);
      }
    } catch (err) {
      console.error('Error generating audio feedback:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate audio feedback'));
    } finally {
      setIsGeneratingAudio(false);
    }
  };
  
  return {
    feedback,
    audioUrl,
    isGenerating,
    isGeneratingAudio,
    feedbackId,
    generateFeedbackForSession,
    generateAudioForFeedback,
    error
  };
};
