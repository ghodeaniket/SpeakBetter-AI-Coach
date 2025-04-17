import Share, { ShareOptions } from 'react-native-share';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface ShareProgressOptions {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

interface ShareFeedbackOptions {
  sessionId: string;
  sessionDate: string;
  feedbackText: string;
  metrics: {
    wordsPerMinute: number;
    fillerWordPercentage: number;
    clarityScore: number;
  };
}

class SharingService {
  /**
   * Share progress to social media or other apps
   */
  async shareProgress(options: ShareProgressOptions) {
    try {
      let shareOptions: ShareOptions = {
        title: options.title || 'Check out my SpeakBetter progress!',
        message: options.message || 'I\'ve been improving my speaking skills with SpeakBetter AI Coach!',
      };
      
      // If there's a URL to share
      if (options.url) {
        shareOptions.url = options.url;
      }
      
      // If we need to generate and share an image
      if (options.data && Object.keys(options.data).length > 0) {
        // This would need integration with a library to generate images
        // For now, we'll just use a placeholder implementation
        console.log('Would generate image with data:', options.data);
      }
      
      const result = await Share.open(shareOptions);
      return result;
    } catch (error) {
      console.error('Error sharing progress:', error);
      // User cancelled or sharing failed
      if ((error as any).message !== 'User did not share') {
        throw error;
      }
      return null;
    }
  }
  
  /**
   * Share session feedback
   */
  async shareFeedback(options: ShareFeedbackOptions) {
    try {
      // Create a nicely formatted message with the feedback details
      const message = `
My SpeakBetter Session (${options.sessionDate})

Feedback:
${options.feedbackText}

Metrics:
- Speaking rate: ${options.metrics.wordsPerMinute} words per minute
- Filler words: ${options.metrics.fillerWordPercentage}%
- Clarity score: ${options.metrics.clarityScore}/100

Shared from SpeakBetter AI Coach App
      `.trim();
      
      const shareOptions: ShareOptions = {
        title: 'My Speech Feedback',
        message: message,
      };
      
      const result = await Share.open(shareOptions);
      return result;
    } catch (error) {
      console.error('Error sharing feedback:', error);
      // User cancelled or sharing failed
      if ((error as any).message !== 'User did not share') {
        throw error;
      }
      return null;
    }
  }
  
  /**
   * Share app with friends
   */
  async shareApp() {
    try {
      const message = 'Check out SpeakBetter AI Coach - an app that helps improve your speaking skills with real-time AI feedback!';
      const appLink = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/speakbetter/id1234567890' 
        : 'https://play.google.com/store/apps/details?id=com.speakbetter.app';
      
      const shareOptions: ShareOptions = {
        title: 'Share SpeakBetter AI Coach',
        message: message,
        url: appLink,
      };
      
      const result = await Share.open(shareOptions);
      return result;
    } catch (error) {
      console.error('Error sharing app:', error);
      // User cancelled or sharing failed
      if ((error as any).message !== 'User did not share') {
        throw error;
      }
      return null;
    }
  }
  
  /**
   * Export progress data as CSV
   */
  async exportProgressData(userId: string, sessions: any[]) {
    try {
      // Create CSV content from sessions data
      let csvContent = 'Date,Duration,Words Per Minute,Filler Word %,Clarity Score\n';
      
      sessions.forEach(session => {
        csvContent += `${session.date},${session.durationSeconds},${session.metrics.wordsPerMinute},${session.metrics.fillerWordPercentage},${session.metrics.clarityScore}\n`;
      });
      
      // Write CSV to temporary file
      const tempFilePath = `${FileSystem.cacheDirectory}speakbetter-progress-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(tempFilePath, csvContent);
      
      // Share the file
      const shareOptions: ShareOptions = {
        title: 'Export SpeakBetter Progress',
        url: `file://${tempFilePath}`,
        type: 'text/csv',
      };
      
      const result = await Share.open(shareOptions);
      
      // Clean up temporary file
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
      
      return result;
    } catch (error) {
      console.error('Error exporting progress data:', error);
      // User cancelled or sharing failed
      if ((error as any).message !== 'User did not share') {
        throw error;
      }
      return null;
    }
  }
}

export const sharingService = new SharingService();
