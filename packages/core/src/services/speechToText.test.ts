import { SpeechToTextService, TranscriptionOptions } from './speechToText';
import { SpeechAnalysis } from '../models/analysis';

// Create a mock implementation of the SpeechToTextService
const createMockSpeechToTextService = (): SpeechToTextService => {
  return {
    transcribeAudio: async (options: TranscriptionOptions): Promise<SpeechAnalysis> => {
      // Mock implementation
      return {
        id: 'analysis123',
        sessionId: 'session456',
        userId: 'user789',
        transcription: 'This is a mock transcription with some um filler uh words like you know.',
        metrics: {
          wordsPerMinute: 150,
          totalWords: 14,
          durationSeconds: 5.6,
          fillerWordCounts: { 'um': 1, 'uh': 1, 'like': 1 },
          totalFillerWords: 3,
          fillerWordPercentage: 21.42, // 3/14 * 100
          clarityScore: 78,
        },
        timestamp: new Date(),
      };
    },
    
    analyzeTranscription: (transcription: string): SpeechAnalysis => {
      const words = transcription.split(/\s+/).filter(Boolean);
      const fillerWordCounts = this.getFillerWordStatistics(transcription);
      const totalFillerWords = Object.values(fillerWordCounts).reduce((a, b) => a + b, 0);
      
      return {
        id: 'analysis-mock',
        sessionId: '',
        userId: '',
        transcription,
        metrics: {
          wordsPerMinute: 0, // Would be calculated with duration
          totalWords: words.length,
          durationSeconds: 0, // Would be set by caller
          fillerWordCounts,
          totalFillerWords,
          fillerWordPercentage: words.length > 0 ? (totalFillerWords / words.length) * 100 : 0,
          clarityScore: 0, // Would be calculated
        },
        timestamp: new Date(),
      };
    },
    
    getFillerWordStatistics: (transcription: string): Record<string, number> => {
      const fillerWords = ['um', 'uh', 'like', 'so', 'you know'];
      const words = transcription.toLowerCase().split(/\s+/).filter(Boolean);
      
      return fillerWords.reduce((counts, filler) => {
        counts[filler] = words.filter(word => word === filler || word === `${filler},`).length;
        return counts;
      }, {} as Record<string, number>);
    },
    
    calculateSpeakingRate: (transcription: string, durationSeconds: number): number => {
      const words = transcription.split(/\s+/).filter(Boolean).length;
      return durationSeconds > 0 ? (words / durationSeconds) * 60 : 0;
    },
    
    calculateClarityScore: (analysis: Partial<SpeechAnalysis>): number => {
      // Mock implementation
      return 75;
    }
  };
};

describe('SpeechToTextService interface', () => {
  let service: SpeechToTextService;
  
  beforeEach(() => {
    service = createMockSpeechToTextService();
  });
  
  it('should transcribe audio correctly', async () => {
    // Create a mock Blob
    const audioBlob = new Blob([''], { type: 'audio/wav' });
    
    const options: TranscriptionOptions = {
      audioBlob,
      languageCode: 'en-US',
      enableWordTimestamps: true,
    };
    
    const result = await service.transcribeAudio(options);
    
    expect(result).toBeDefined();
    expect(result.transcription).toContain('filler');
    expect(result.metrics).toBeDefined();
    expect(result.metrics.totalWords).toBeGreaterThan(0);
  });
  
  it('should analyze transcription correctly', () => {
    const transcription = 'This is a test with some um filler words';
    
    const result = service.analyzeTranscription(transcription);
    
    expect(result).toBeDefined();
    expect(result.transcription).toBe(transcription);
    expect(result.metrics.totalWords).toBe(8);
  });
  
  it('should detect filler words correctly', () => {
    const transcription = 'This is um a test with uh some like filler words';
    
    const result = service.getFillerWordStatistics(transcription);
    
    expect(result).toBeDefined();
    expect(result['um']).toBe(1);
    expect(result['uh']).toBe(1);
    expect(result['like']).toBe(1);
  });
  
  it('should calculate speaking rate correctly', () => {
    const transcription = 'This is a test with some filler words';
    const durationSeconds = 3;
    
    const result = service.calculateSpeakingRate(transcription, durationSeconds);
    
    // 8 words / 3 seconds * 60 = 160 words per minute
    expect(result).toBe(160);
  });
  
  it('should calculate clarity score', () => {
    const partialAnalysis: Partial<SpeechAnalysis> = {
      transcription: 'This is a test with some um filler words',
      metrics: {
        wordsPerMinute: 150,
        totalWords: 8,
        durationSeconds: 3.2,
        fillerWordCounts: { 'um': 1 },
        totalFillerWords: 1,
        fillerWordPercentage: 12.5,
        clarityScore: 0, // To be calculated
      }
    };
    
    const result = service.calculateClarityScore(partialAnalysis);
    
    expect(result).toBeGreaterThan(0);
  });
});