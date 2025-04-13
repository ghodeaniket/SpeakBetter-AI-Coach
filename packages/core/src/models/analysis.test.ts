import { SpeechAnalysis, SpeechMetrics, WordTiming, FillerInstance } from './analysis';

describe('SpeechAnalysis model', () => {
  it('should have the correct structure', () => {
    const metrics: SpeechMetrics = {
      wordsPerMinute: 150,
      totalWords: 300,
      durationSeconds: 120,
      fillerWordCounts: { 'um': 5, 'uh': 3, 'like': 8 },
      totalFillerWords: 16,
      fillerWordPercentage: 5.33,
      clarityScore: 85,
    };

    const analysis: SpeechAnalysis = {
      id: 'analysis123',
      sessionId: 'session456',
      userId: 'user789',
      transcription: 'This is a test transcription with some um filler uh words like you know.',
      metrics,
      timestamp: new Date(),
    };
    
    expect(analysis.id).toBe('analysis123');
    expect(analysis.sessionId).toBe('session456');
    expect(analysis.userId).toBe('user789');
    expect(analysis.transcription).toContain('filler');
    expect(analysis.metrics.wordsPerMinute).toBe(150);
    expect(analysis.metrics.totalFillerWords).toBe(16);
    expect(analysis.metrics.clarityScore).toBe(85);
  });
  
  it('should support optional wordTimings', () => {
    const metrics: SpeechMetrics = {
      wordsPerMinute: 150,
      totalWords: 300,
      durationSeconds: 120,
      fillerWordCounts: { 'um': 5, 'uh': 3, 'like': 8 },
      totalFillerWords: 16,
      fillerWordPercentage: 5.33,
      clarityScore: 85,
    };
    
    const wordTimings: WordTiming[] = [
      { word: 'This', startTime: 0.1, endTime: 0.4 },
      { word: 'is', startTime: 0.5, endTime: 0.7 },
      { word: 'a', startTime: 0.8, endTime: 0.9 },
      { word: 'test', startTime: 1.0, endTime: 1.4 },
    ];
    
    const analysis: SpeechAnalysis = {
      id: 'analysis123',
      sessionId: 'session456',
      userId: 'user789',
      transcription: 'This is a test',
      metrics,
      wordTimings,
      timestamp: new Date(),
    };
    
    expect(analysis.wordTimings).toBeDefined();
    expect(analysis.wordTimings?.length).toBe(4);
    expect(analysis.wordTimings?.[0].word).toBe('This');
    expect(analysis.wordTimings?.[0].startTime).toBe(0.1);
    expect(analysis.wordTimings?.[0].endTime).toBe(0.4);
  });
  
  it('should support optional fillerInstances', () => {
    const metrics: SpeechMetrics = {
      wordsPerMinute: 150,
      totalWords: 300,
      durationSeconds: 120,
      fillerWordCounts: { 'um': 5, 'uh': 3, 'like': 8 },
      totalFillerWords: 16,
      fillerWordPercentage: 5.33,
      clarityScore: 85,
    };
    
    const fillerInstances: FillerInstance[] = [
      { word: 'um', timestamp: 5.2 },
      { word: 'like', timestamp: 10.5 },
      { word: 'uh', timestamp: 15.8 },
    ];
    
    const analysis: SpeechAnalysis = {
      id: 'analysis123',
      sessionId: 'session456',
      userId: 'user789',
      transcription: 'This is a test um with like some uh fillers',
      metrics,
      fillerInstances,
      timestamp: new Date(),
    };
    
    expect(analysis.fillerInstances).toBeDefined();
    expect(analysis.fillerInstances?.length).toBe(3);
    expect(analysis.fillerInstances?.[0].word).toBe('um');
    expect(analysis.fillerInstances?.[0].timestamp).toBe(5.2);
  });
  
  it('should calculate metrics correctly', () => {
    const metrics: SpeechMetrics = {
      wordsPerMinute: 150,
      totalWords: 300,
      durationSeconds: 120,
      fillerWordCounts: { 'um': 5, 'uh': 3, 'like': 8 },
      totalFillerWords: 16,
      fillerWordPercentage: 5.33,
      clarityScore: 85,
    };
    
    expect(metrics.totalFillerWords).toBe(
      Object.values(metrics.fillerWordCounts).reduce((sum, count) => sum + count, 0)
    );
    
    // Check that fillerWordPercentage is approximately correct
    const expectedPercentage = (metrics.totalFillerWords / metrics.totalWords) * 100;
    expect(Math.abs(metrics.fillerWordPercentage - expectedPercentage)).toBeLessThan(0.1);
    
    // Check that wordsPerMinute is approximately correct
    const expectedWPM = (metrics.totalWords / metrics.durationSeconds) * 60;
    expect(Math.abs(metrics.wordsPerMinute - expectedWPM)).toBeLessThan(0.1);
  });
});