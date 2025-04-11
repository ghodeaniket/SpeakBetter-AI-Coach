/**
 * Tests for Speech Service Interface
 */

import { SpeechService, TranscriptionOptions, SpeechSynthesisOptions } from '../speech';

/**
 * Mock implementation of SpeechService for testing
 */
class MockSpeechService implements SpeechService {
  transcribe = jest.fn();
  synthesize = jest.fn();
  getAvailableVoices = jest.fn();
  getVoicesForLanguage = jest.fn();
  getVoiceById = jest.fn();
  cancel = jest.fn();
  isRecognitionSupported = jest.fn();
  isSynthesisSupported = jest.fn();
}

describe('SpeechService Interface', () => {
  let service: SpeechService;
  
  beforeEach(() => {
    service = new MockSpeechService();
  });
  
  describe('transcribe', () => {
    it('should call transcribe with correct options', async () => {
      const options: TranscriptionOptions = {
        audioFile: new Blob(),
        languageCode: 'en-US',
        profanityFilter: true
      };
      
      (service.transcribe as jest.Mock).mockResolvedValue({
        text: 'test transcription',
        confidence: 0.9,
        wordTimings: [],
        languageCode: 'en-US',
        durationSeconds: 2
      });
      
      await service.transcribe(options);
      
      expect(service.transcribe).toHaveBeenCalledWith(options);
    });
    
    it('should return transcription result', async () => {
      const result = {
        text: 'test transcription',
        confidence: 0.9,
        wordTimings: [],
        languageCode: 'en-US',
        durationSeconds: 2
      };
      
      (service.transcribe as jest.Mock).mockResolvedValue(result);
      
      const response = await service.transcribe({ audioFile: new Blob() });
      
      expect(response).toEqual(result);
    });
  });
  
  describe('synthesize', () => {
    it('should call synthesize with correct options', async () => {
      const options: SpeechSynthesisOptions = {
        text: 'test synthesis',
        voiceId: 'test-voice',
        speakingRate: 1.2
      };
      
      (service.synthesize as jest.Mock).mockResolvedValue(new Blob());
      
      await service.synthesize(options);
      
      expect(service.synthesize).toHaveBeenCalledWith(options);
    });
    
    it('should return audio blob', async () => {
      const blob = new Blob(['test audio'], { type: 'audio/mp3' });
      
      (service.synthesize as jest.Mock).mockResolvedValue(blob);
      
      const response = await service.synthesize({ text: 'test' });
      
      expect(response).toBe(blob);
    });
  });
  
  describe('getAvailableVoices', () => {
    it('should return list of voices', async () => {
      const voices = [
        {
          id: 'voice-1',
          name: 'Voice 1',
          languageCode: 'en-US',
          gender: 'female' as const,
          isNeural: true
        },
        {
          id: 'voice-2',
          name: 'Voice 2',
          languageCode: 'en-GB',
          gender: 'male' as const,
          isNeural: false
        }
      ];
      
      (service.getAvailableVoices as jest.Mock).mockResolvedValue(voices);
      
      const response = await service.getAvailableVoices();
      
      expect(response).toEqual(voices);
    });
  });
  
  describe('getVoicesForLanguage', () => {
    it('should filter voices by language', async () => {
      (service.getVoicesForLanguage as jest.Mock).mockImplementation((languageCode) => {
        if (languageCode === 'en-US') {
          return Promise.resolve([
            {
              id: 'voice-1',
              name: 'Voice 1',
              languageCode: 'en-US',
              gender: 'female' as const,
              isNeural: true
            }
          ]);
        }
        return Promise.resolve([]);
      });
      
      const voices = await service.getVoicesForLanguage('en-US');
      
      expect(voices.length).toBe(1);
      expect(voices[0].languageCode).toBe('en-US');
    });
  });
  
  describe('getVoiceById', () => {
    it('should return voice by ID', async () => {
      const voice = {
        id: 'voice-1',
        name: 'Voice 1',
        languageCode: 'en-US',
        gender: 'female' as const,
        isNeural: true
      };
      
      (service.getVoiceById as jest.Mock).mockResolvedValue(voice);
      
      const response = await service.getVoiceById('voice-1');
      
      expect(response).toEqual(voice);
    });
    
    it('should return null for non-existent voice', async () => {
      (service.getVoiceById as jest.Mock).mockResolvedValue(null);
      
      const response = await service.getVoiceById('nonexistent');
      
      expect(response).toBeNull();
    });
  });
  
  describe('cancel', () => {
    it('should cancel ongoing operations', () => {
      service.cancel();
      
      expect(service.cancel).toHaveBeenCalled();
    });
  });
  
  describe('isRecognitionSupported', () => {
    it('should return recognition support status', () => {
      (service.isRecognitionSupported as jest.Mock).mockReturnValue(true);
      
      const supported = service.isRecognitionSupported();
      
      expect(supported).toBe(true);
    });
  });
  
  describe('isSynthesisSupported', () => {
    it('should return synthesis support status', () => {
      (service.isSynthesisSupported as jest.Mock).mockReturnValue(true);
      
      const supported = service.isSynthesisSupported();
      
      expect(supported).toBe(true);
    });
  });
});
