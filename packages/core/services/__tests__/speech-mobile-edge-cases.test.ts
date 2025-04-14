/**
 * Tests for Speech Service Interface - Mobile Edge Cases
 * 
 * This test suite focuses on scenarios that are particularly relevant
 * to mobile environments, such as:
 * - App backgrounding & interruptions
 * - Permission changes during operation
 * - Memory constraints
 * - Battery optimization impacts
 * - Intermittent connectivity
 */

import { SpeechService, TranscriptionOptions, SpeechSynthesisOptions } from '../speech';
import { AppErrorImpl, ErrorCodes, ErrorCategory, createAppError } from '../../models/error';

/**
 * Extended mock implementation of SpeechService for testing edge cases
 */
class MockMobileSpeechService implements SpeechService {
  // Base implementation
  transcribe = jest.fn();
  synthesize = jest.fn();
  getAvailableVoices = jest.fn();
  getVoicesForLanguage = jest.fn();
  getVoiceById = jest.fn();
  cancel = jest.fn();
  isRecognitionSupported = jest.fn();
  isSynthesisSupported = jest.fn();
  
  // Track internal state for testing edge cases
  private _isTranscribing = false;
  private _isSynthesizing = false;
  
  // Mocks for mobile-specific states
  private _isBackgrounded = false;
  private _permissionStatus: 'granted' | 'denied' | 'prompt' = 'granted';
  private _batteryStatus: 'normal' | 'low-power' = 'normal';
  private _connectivityStatus: 'online' | 'offline' | 'poor' = 'online';
  private _memoryPressure: 'normal' | 'low' | 'critical' = 'normal';
  
  constructor() {
    // Default implementations
    this.isRecognitionSupported.mockReturnValue(true);
    this.isSynthesisSupported.mockReturnValue(true);
    
    // Setup transcribe with mobile edge cases
    this.transcribe.mockImplementation(async (options: TranscriptionOptions) => {
      if (this._permissionStatus === 'denied') {
        const error = new Error('Microphone permission denied');
        throw error;
      }
      
      if (this._isTranscribing) {
        const error = new Error('Already transcribing');
        throw error;
      }
      
      this._isTranscribing = true;
      
      try {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Check for backgrounding
        if (this._isBackgrounded) {
          const error = new Error('Application backgrounded');
          throw error;
        }
        
        // Check for connectivity issues
        if (this._connectivityStatus === 'offline') {
          const error = new Error('No internet connection');
          throw error;
        }
        
        if (this._connectivityStatus === 'poor') {
          // Simulate timeout
          await new Promise(resolve => setTimeout(resolve, 100));
          const error = new Error('Request timed out');
          throw error;
        }
        
        // Check for memory pressure
        if (this._memoryPressure === 'critical') {
          const error = new Error('Insufficient memory');
          throw error;
        }
        
        // Check if cancelled during processing
        if (!this._isTranscribing) {
          const error = new Error('Transcription cancelled');
          throw error;
        }
        
        return {
          text: 'test transcription',
          confidence: 0.9,
          wordTimings: [],
          languageCode: options.languageCode || 'en-US',
          durationSeconds: 2
        };
      } finally {
        this._isTranscribing = false;
      }
    });
    
    // Setup synthesize with mobile edge cases
    this.synthesize.mockImplementation(async (options: SpeechSynthesisOptions) => {
      if (this._isSynthesizing) {
        const error = new Error('Already synthesizing');
        throw error;
      }
      
      this._isSynthesizing = true;
      
      try {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Check for backgrounding
        if (this._isBackgrounded) {
          const error = new Error('Application backgrounded');
          throw error;
        }
        
        // Check for low power mode
        if (this._batteryStatus === 'low-power') {
          // In low power mode, synthesis might be degraded or limited
          await new Promise(resolve => setTimeout(resolve, 5));
          return new Blob(['low-quality-audio'], { type: 'audio/mp3' });
        }
        
        // Check if cancelled
        if (!this._isSynthesizing) {
          const error = new Error('Synthesis cancelled');
          throw error;
        }
        
        return new Blob(['test-audio'], { type: 'audio/mp3' });
      } finally {
        this._isSynthesizing = false;
      }
    });
    
    // Setup cancel
    this.cancel.mockImplementation(() => {
      this._isTranscribing = false;
      this._isSynthesizing = false;
    });
  }
  
  // Helper methods for test control
  
  simulateBackground() {
    this._isBackgrounded = true;
  }
  
  simulateForeground() {
    this._isBackgrounded = false;
  }
  
  setPermissionStatus(status: 'granted' | 'denied' | 'prompt') {
    this._permissionStatus = status;
  }
  
  setBatteryStatus(status: 'normal' | 'low-power') {
    this._batteryStatus = status;
  }
  
  setConnectivityStatus(status: 'online' | 'offline' | 'poor') {
    this._connectivityStatus = status;
  }
  
  setMemoryPressure(level: 'normal' | 'low' | 'critical') {
    this._memoryPressure = level;
  }
}

describe('SpeechService Mobile Edge Cases', () => {
  let service: MockMobileSpeechService;
  
  beforeEach(() => {
    service = new MockMobileSpeechService();
  });
  
  describe('App Lifecycle Interruptions', () => {
    it('should handle app backgrounding during transcription', async () => {
      // Start transcription
      const promise = service.transcribe({ audioFile: new Blob() });
      
      // Simulate app going to background
      service.simulateBackground();
      
      // Should throw error
      await expect(promise).rejects.toThrow('Application backgrounded');
    });
    
    it('should handle app backgrounding during synthesis', async () => {
      // Start synthesis
      const promise = service.synthesize({ text: 'test' });
      
      // Simulate app going to background
      service.simulateBackground();
      
      // Should throw error
      await expect(promise).rejects.toThrow('Application backgrounded');
    });
    
    it('should recover when app returns to foreground', async () => {
      // Simulate app in background
      service.simulateBackground();
      
      // First operation should fail
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('Application backgrounded');
      
      // Return to foreground
      service.simulateForeground();
      
      // Next operation should succeed
      await expect(service.transcribe({ audioFile: new Blob() }))
        .resolves.toHaveProperty('text', 'test transcription');
    });
  });
  
  describe('Permission Changes', () => {
    it('should handle permission revocation during usage', async () => {
      // First call with permission granted
      const firstPromise = service.transcribe({ audioFile: new Blob() });
      
      // Revoke permission before first call completes
      service.setPermissionStatus('denied');
      
      // First call should complete successfully because it already started
      await expect(firstPromise).resolves.toHaveProperty('text', 'test transcription');
      
      // Second call should fail due to revoked permission
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('Microphone permission denied');
    });
    
    it('should recover when permission is granted again', async () => {
      // Start with denied permission
      service.setPermissionStatus('denied');
      
      // Operation should fail
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('Microphone permission denied');
      
      // Grant permission
      service.setPermissionStatus('granted');
      
      // Operation should now succeed
      await expect(service.transcribe({ audioFile: new Blob() }))
        .resolves.toHaveProperty('text', 'test transcription');
    });
  });
  
  describe('Battery Optimization', () => {
    it('should provide degraded service in low power mode', async () => {
      // Set low power mode
      service.setBatteryStatus('low-power');
      
      // Synthesis should still work but may be lower quality
      const result = await service.synthesize({ text: 'test' });
      
      // Check for the low quality audio
      const text = await new Response(result).text();
      expect(text).toBe('low-quality-audio');
    });
  });
  
  describe('Connectivity Issues', () => {
    it('should handle offline status', async () => {
      // Set offline
      service.setConnectivityStatus('offline');
      
      // Should throw network error
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('No internet connection');
    });
    
    it('should handle poor connectivity', async () => {
      // Set poor connection
      service.setConnectivityStatus('poor');
      
      // Should throw timeout error
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('Request timed out');
    });
    
    it('should recover when connection is restored', async () => {
      // Start offline
      service.setConnectivityStatus('offline');
      
      // Operation should fail
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('No internet connection');
      
      // Restore connection
      service.setConnectivityStatus('online');
      
      // Operation should now succeed
      await expect(service.transcribe({ audioFile: new Blob() }))
        .resolves.toHaveProperty('text', 'test transcription');
    });
  });
  
  describe('Memory Constraints', () => {
    it('should handle critical memory pressure', async () => {
      // Set critical memory pressure
      service.setMemoryPressure('critical');
      
      // Should throw memory error
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('Insufficient memory');
    });
    
    it('should recover when memory pressure is relieved', async () => {
      // Start with critical memory pressure
      service.setMemoryPressure('critical');
      
      // Operation should fail
      await expect(service.transcribe({ audioFile: new Blob() }))
        .rejects.toThrow('Insufficient memory');
      
      // Relieve memory pressure
      service.setMemoryPressure('normal');
      
      // Operation should now succeed
      await expect(service.transcribe({ audioFile: new Blob() }))
        .resolves.toHaveProperty('text', 'test transcription');
    });
  });
  
  describe('Concurrent Operations', () => {
    it('should prevent multiple simultaneous transcriptions', async () => {
      // Start first transcription
      const firstPromise = service.transcribe({ audioFile: new Blob() });
      
      // Try to start second transcription immediately
      const secondPromise = service.transcribe({ audioFile: new Blob() });
      
      // Second should fail
      await expect(secondPromise).rejects.toThrow('Already transcribing');
      
      // First should complete normally
      await expect(firstPromise).resolves.toHaveProperty('text', 'test transcription');
    });
    
    it('should prevent multiple simultaneous synthesis operations', async () => {
      // Start first synthesis
      const firstPromise = service.synthesize({ text: 'test' });
      
      // Try to start second synthesis immediately
      const secondPromise = service.synthesize({ text: 'test' });
      
      // Second should fail
      await expect(secondPromise).rejects.toThrow('Already synthesizing');
      
      // First should complete normally
      await expect(firstPromise).resolves.toBeTruthy();
    });
  });
});