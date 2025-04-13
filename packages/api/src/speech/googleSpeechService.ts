import { SpeechToTextService, TranscriptionOptions, SpeechAnalysis } from '@speakbetter/core';

export interface GoogleSpeechServiceConfig {
  apiKey: string;
  apiEndpoint?: string;
}

export const createGoogleSpeechService = (config: GoogleSpeechServiceConfig): SpeechToTextService => {
  const endpoint = config.apiEndpoint || 'https://speech.googleapis.com/v1/speech:recognize';
  
  // Helper function to safely get filler word counts
  const getFillerWordStatistics = (transcription: string): Record<string, number> => {
    const fillerWords = ['um', 'uh', 'like', 'so', 'you know'];
    const words = transcription.toLowerCase().split(/\s+/).filter(Boolean);
    
    return fillerWords.reduce((counts, filler) => {
      counts[filler] = words.filter(word => word === filler || word === `${filler},`).length;
      return counts;
    }, {} as Record<string, number>);
  };
  
  // Helper function to calculate speaking rate
  const calculateSpeakingRate = (transcription: string, durationSeconds: number): number => {
    const words = transcription.split(/\s+/).filter(Boolean).length;
    return durationSeconds > 0 ? (words / durationSeconds) * 60 : 0;
  };
  
  // Helper function to calculate clarity score
  const calculateClarityScore = (analysis: Partial<SpeechAnalysis>): number => {
    // A simple algorithm to calculate clarity score based on filler word percentage
    const fillerPercentage = analysis.metrics?.fillerWordPercentage ?? 0;
    
    // Higher score for lower filler word percentage
    // Base score of 100, deduct points for filler words
    const baseScore = 100;
    const fillerPenalty = Math.min(fillerPercentage * 2, 50); // Cap at 50 points penalty
    
    return Math.max(baseScore - fillerPenalty, 0);
  };
  
  return {
    transcribeAudio: async (options: TranscriptionOptions): Promise<SpeechAnalysis> => {
      // Implementation would send audio to Google Speech API
      // This is a placeholder for the actual implementation
      
      // Convert audio to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(options.audioBlob);
      });
      
      // Call Google Speech API
      const response = await fetch(`${endpoint}?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            languageCode: options.languageCode || 'en-US',
            enableWordTimeOffsets: options.enableWordTimestamps || false,
          },
          audio: {
            content: audioBase64,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Speech API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process API response into SpeechAnalysis format
      const transcription = data.results?.[0]?.alternatives?.[0]?.transcript || '';
      const words = transcription.split(/\s+/).filter(Boolean);
      
      const fillerWordCounts = getFillerWordStatistics(transcription);
      const totalFillerWords = Object.values(fillerWordCounts).reduce((a, b) => a + b, 0);
      const fillerWordPercentage = words.length > 0 ? (totalFillerWords / words.length) * 100 : 0;
      
      // Create the analysis object
      const analysis: SpeechAnalysis = {
        id: Date.now().toString(),
        sessionId: '', // Would be set by the caller
        userId: '',    // Would be set by the caller
        transcription,
        metrics: {
          wordsPerMinute: 0,  // Would be calculated with duration
          totalWords: words.length,
          durationSeconds: 0, // Would be set by caller
          fillerWordCounts,
          totalFillerWords,
          fillerWordPercentage,
          clarityScore: 0,    // Will be calculated below
        },
        timestamp: new Date(),
      };
      
      // Calculate clarity score
      analysis.metrics.clarityScore = calculateClarityScore(analysis);
      
      return analysis;
    },
    
    analyzeTranscription: (transcription: string): SpeechAnalysis => {
      const words = transcription.split(/\s+/).filter(Boolean);
      
      const fillerWordCounts = getFillerWordStatistics(transcription);
      const totalFillerWords = Object.values(fillerWordCounts).reduce((a, b) => a + b, 0);
      const fillerWordPercentage = words.length > 0 ? (totalFillerWords / words.length) * 100 : 0;
      
      const analysis: SpeechAnalysis = {
        id: Date.now().toString(),
        sessionId: '',
        userId: '',
        transcription,
        metrics: {
          wordsPerMinute: 0, // Would be calculated with duration
          totalWords: words.length,
          durationSeconds: 0, // Would be set by caller
          fillerWordCounts,
          totalFillerWords,
          fillerWordPercentage,
          clarityScore: 0, // Will be calculated below
        },
        timestamp: new Date(),
      };
      
      // Calculate clarity score
      analysis.metrics.clarityScore = calculateClarityScore(analysis);
      
      return analysis;
    },
    
    getFillerWordStatistics,
    calculateSpeakingRate,
    calculateClarityScore
  };
};
