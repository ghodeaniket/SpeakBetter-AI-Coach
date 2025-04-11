/**
 * Tests for Mock Service Factory
 */

import { MockServiceFactory } from '../factory';
import { SpeechService } from '../speech';
import { AudioService } from '../audio';
import { VisualizationService } from '../visualization';

describe('MockServiceFactory', () => {
  let factory: MockServiceFactory;
  
  beforeEach(() => {
    factory = new MockServiceFactory();
  });
  
  it('should return the correct platform', () => {
    expect(factory.getPlatform()).toBe('test');
  });
  
  it('should create a speech service', () => {
    const service = factory.getSpeechService();
    
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(Object);
    expect(typeof service.transcribe).toBe('function');
    expect(typeof service.synthesize).toBe('function');
    expect(typeof service.getAvailableVoices).toBe('function');
    expect(typeof service.getVoicesForLanguage).toBe('function');
    expect(typeof service.getVoiceById).toBe('function');
    expect(typeof service.cancel).toBe('function');
    expect(typeof service.isRecognitionSupported).toBe('function');
    expect(typeof service.isSynthesisSupported).toBe('function');
  });
  
  it('should create an audio service', () => {
    const service = factory.getAudioService();
    
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(Object);
    expect(typeof service.requestPermission).toBe('function');
    expect(typeof service.isRecordingSupported).toBe('function');
    expect(typeof service.startRecording).toBe('function');
    expect(typeof service.stopRecording).toBe('function');
    expect(typeof service.pauseRecording).toBe('function');
    expect(typeof service.resumeRecording).toBe('function');
    expect(typeof service.cancelRecording).toBe('function');
    expect(typeof service.getRecordingState).toBe('function');
    expect(typeof service.playAudio).toBe('function');
    expect(typeof service.pauseAudio).toBe('function');
    expect(typeof service.stopAudio).toBe('function');
    expect(typeof service.getPlaybackTime).toBe('function');
    expect(typeof service.setPlaybackTime).toBe('function');
    expect(typeof service.getAudioDuration).toBe('function');
    expect(typeof service.isPlaying).toBe('function');
    expect(typeof service.getVisualizationData).toBe('function');
    expect(typeof service.convertFormat).toBe('function');
    expect(typeof service.createAudioUrl).toBe('function');
    expect(typeof service.revokeAudioUrl).toBe('function');
  });
  
  it('should create a visualization service', () => {
    const service = factory.getVisualizationService();
    
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(Object);
    expect(typeof service.createContext).toBe('function');
    expect(typeof service.releaseContext).toBe('function');
    expect(typeof service.drawAudioVisualization).toBe('function');
    expect(typeof service.drawWordTimings).toBe('function');
    expect(typeof service.drawWaveform).toBe('function');
    expect(typeof service.createWaveformImage).toBe('function');
    expect(typeof service.createSpectrogramImage).toBe('function');
    expect(typeof service.isSupported).toBe('function');
  });
  
  it('should return the same instance for multiple calls', () => {
    const speechService1 = factory.getSpeechService();
    const speechService2 = factory.getSpeechService();
    
    expect(speechService1).toBe(speechService2);
    
    const audioService1 = factory.getAudioService();
    const audioService2 = factory.getAudioService();
    
    expect(audioService1).toBe(audioService2);
    
    const visualizationService1 = factory.getVisualizationService();
    const visualizationService2 = factory.getVisualizationService();
    
    expect(visualizationService1).toBe(visualizationService2);
  });
  
  it('should return all services', () => {
    const services = factory.getAllServices();
    
    expect(services.speech).toBeDefined();
    expect(services.audio).toBeDefined();
    expect(services.visualization).toBeDefined();
    expect(services.auth).toBeDefined();
    expect(services.user).toBeDefined();
    expect(services.session).toBeDefined();
    expect(services.analysis).toBeDefined();
    expect(services.feedback).toBeDefined();
    expect(services.localStorage).toBeDefined();
    expect(services.remoteStorage).toBeDefined();
    expect(services.network).toBeDefined();
  });
});
