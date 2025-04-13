import { createGoogleSpeechService } from '../googleSpeechService';
import { SpeechToTextService, TranscriptionOptions } from '@speakbetter/core';

// Mock global fetch
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      results: [
        {
          alternatives: [
            {
              transcript: 'This is a test transcription with um some uh filler words'
            }
          ]
        }
      ]
    })
  })
) as jest.Mock;

// Mock FileReader
global.FileReader = class {
  onloadend: (() => void) | null = null;
  readAsDataURL() {
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
  result = 'data:audio/webm;base64,SGVsbG8gV29ybGQ=';
} as any;

describe('GoogleSpeechService', () => {
  let speechService: SpeechToTextService;
  
  beforeEach(() => {
    speechService = createGoogleSpeechService({
      apiKey: 'test-api-key'
    });
    
    jest.clearAllMocks();
  });
  
  it('should transcribe audio', async () => {
    const options: TranscriptionOptions = {
      audioBlob: new Blob(['test audio data'], { type: 'audio/webm' }),
      languageCode: 'en-US',
      enableWordTimestamps: true
    };
    
    const result = await speechService.transcribeAudio(options);
    
    expect(result).toEqual(expect.objectContaining({
      transcription: 'This is a test transcription with um some uh filler words',
      metrics: expect.objectContaining({
        totalWords: expect.any(Number),
        fillerWordCounts: expect.objectContaining({
          'um': expect.any(Number),
          'uh': expect.any(Number)
        })
      })
    }));
    
    expect(fetch).toHaveBeenCalledWith(
      'https://speech.googleapis.com/v1/speech:recognize?key=test-api-key',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );
  });
  
  it('should analyze transcription', () => {
    const transcription = 'This is a test with um some uh filler words like you know';
    
    const result = speechService.analyzeTranscription(transcription);
    
    expect(result).toEqual(expect.objectContaining({
      transcription,
      metrics: expect.objectContaining({
        fillerWordCounts: expect.objectContaining({
          'um': expect.any(Number),
          'uh': expect.any(Number),
          'like': expect.any(Number)
        }),
        totalFillerWords: expect.any(Number),
        fillerWordPercentage: expect.any(Number),
        clarityScore: expect.any(Number)
      })
    }));
  });
  
  it('should calculate speaking rate', () => {
    const transcription = 'This is a test with ten words total';
    const durationSeconds = 5;
    
    const rate = speechService.calculateSpeakingRate(transcription, durationSeconds);
    
    // We expect 8 words (it should count "This is a test with ten words total"), 
    // not 10 as the comment suggests (which was incorrect)
    expect(rate).toBe(96); // 8 words / 5 seconds * 60 = 96 WPM
  });
  
  it('should calculate clarity score', () => {
    const analysis = {
      metrics: {
        fillerWordPercentage: 10
      }
    };
    
    const score = speechService.calculateClarityScore(analysis as any);
    
    expect(score).toBe(80); // 100 - (10 * 2) = 80
  });
});
