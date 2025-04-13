/**
 * Tests for Audio Service Interface - Mobile Edge Cases
 * 
 * This test suite focuses on mobile-specific scenarios such as:
 * - Audio interruptions (calls, notifications)
 * - Audio routing changes (headphones, bluetooth)
 * - Background mode recording limitations
 * - Microphone permission dynamics
 */

import { AudioService, AudioRecordingOptions, AudioRecordingState } from '../audio';
import { AppError, ErrorCodes, ErrorCategory, createAppError } from '../../models/error';

/**
 * Mock implementation of AudioService for testing mobile edge cases
 */
class MockMobileAudioService implements AudioService {
  // Base interface implementation
  requestPermission = jest.fn();
  isRecordingSupported = jest.fn();
  startRecording = jest.fn();
  stopRecording = jest.fn();
  pauseRecording = jest.fn();
  resumeRecording = jest.fn();
  cancelRecording = jest.fn();
  getRecordingState = jest.fn();
  playAudio = jest.fn();
  pauseAudio = jest.fn();
  stopAudio = jest.fn();
  getPlaybackTime = jest.fn();
  setPlaybackTime = jest.fn();
  getAudioDuration = jest.fn();
  isPlaying = jest.fn();
  getVisualizationData = jest.fn();
  convertFormat = jest.fn();
  createAudioUrl = jest.fn();
  revokeAudioUrl = jest.fn();
  
  // Internal state for testing
  private _recordingState: AudioRecordingState = {
    isRecording: false,
    durationSeconds: 0,
    audioLevel: 0,
    isProcessing: false,
    isSilent: false,
    error: null
  };
  
  private _permissionStatus: 'granted' | 'denied' | 'prompt' = 'prompt';
  private _isBackgrounded: boolean = false;
  private _audioInterruption: null | 'call' | 'notification' | 'media' = null;
  private _audioRouting: 'speaker' | 'headphones' | 'bluetooth' | 'earpiece' = 'speaker';
  private _isPlaying: boolean = false;
  private _recordedAudio: Blob | null = null;
  private _mockAudioUrls: Map<Blob, string> = new Map();
  private _nextUrlId: number = 1;
  
  constructor() {
    // Setup default implementations
    this.isRecordingSupported.mockReturnValue(true);
    this.getRecordingState.mockImplementation(() => this._recordingState);
    this.isPlaying.mockImplementation(() => this._isPlaying);
    
    // Implement requestPermission
    this.requestPermission.mockImplementation(async () => {
      if (this._permissionStatus === 'prompt') {
        // Simulate user granting permission
        this._permissionStatus = 'granted';
      }
      return this._permissionStatus === 'granted';
    });
    
    // Implement startRecording
    this.startRecording.mockImplementation(async (options?: AudioRecordingOptions) => {
      if (this._permissionStatus !== 'granted') {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          'Microphone permission denied',
          { category: ErrorCategory.PERMISSION }
        );
      }
      
      if (this._recordingState.isRecording) {
        throw createAppError(
          ErrorCodes.ALREADY_RECORDING,
          'Already recording',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      if (this._isBackgrounded) {
        throw createAppError(
          ErrorCodes.BACKGROUND_RECORDING_ERROR,
          'Cannot start recording in background',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      this._recordingState = {
        isRecording: true,
        durationSeconds: 0,
        audioLevel: 0.5,
        isProcessing: false,
        isSilent: false,
        error: null
      };
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check for interruptions that might have occurred during setup
      if (this._audioInterruption) {
        this._recordingState.isRecording = false;
        throw createAppError(
          ErrorCodes.RECORDING_INTERRUPTED,
          `Recording interrupted by ${this._audioInterruption}`,
          { category: ErrorCategory.AUDIO }
        );
      }
    });
    
    // Implement stopRecording
    this.stopRecording.mockImplementation(async () => {
      if (!this._recordingState.isRecording) {
        throw createAppError(
          ErrorCodes.NOT_RECORDING,
          'Not currently recording',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      this._recordingState.isRecording = false;
      this._recordingState.isProcessing = true;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 20));
      
      this._recordingState.isProcessing = false;
      
      // Create mock recorded audio blob
      this._recordedAudio = new Blob(['mock audio data'], { type: 'audio/wav' });
      
      return this._recordedAudio;
    });
    
    // Implement pauseRecording
    this.pauseRecording.mockImplementation(async () => {
      if (!this._recordingState.isRecording) {
        throw new AppError(
          ErrorCodes.NOT_RECORDING,
          'Not currently recording',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      this._recordingState.isRecording = false;
    });
    
    // Implement resumeRecording
    this.resumeRecording.mockImplementation(async () => {
      if (this._recordingState.isRecording) {
        throw new AppError(
          ErrorCodes.ALREADY_RECORDING,
          'Already recording',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      if (this._isBackgrounded) {
        throw createAppError(
          ErrorCodes.BACKGROUND_RECORDING_ERROR,
          'Cannot resume recording in background',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      this._recordingState.isRecording = true;
    });
    
    // Implement cancelRecording
    this.cancelRecording.mockImplementation(() => {
      this._recordingState.isRecording = false;
      this._recordingState.isProcessing = false;
      this._recordedAudio = null;
    });
    
    // Implement playAudio
    this.playAudio.mockImplementation(async (audio: Blob | string) => {
      if (this._isPlaying) {
        this.stopAudio();
      }
      
      // Check for headphones if volume would be too loud
      if (this._audioRouting === 'speaker' && typeof audio !== 'string') {
        // Simulate a warning about loud volume
        console.warn('Playing audio on speaker at high volume');
      }
      
      this._isPlaying = true;
      
      // Simulate audio playback delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check for interruptions
      if (this._audioInterruption === 'call') {
        this._isPlaying = false;
        throw createAppError(
          ErrorCodes.PLAYBACK_INTERRUPTED,
          'Playback interrupted by call',
          { category: ErrorCategory.AUDIO }
        );
      }
    });
    
    // Implement pauseAudio
    this.pauseAudio.mockImplementation(() => {
      if (!this._isPlaying) {
        throw createAppError(
          ErrorCodes.NOT_PLAYING,
          'Audio is not currently playing',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      this._isPlaying = false;
    });
    
    // Implement stopAudio
    this.stopAudio.mockImplementation(() => {
      this._isPlaying = false;
    });
    
    // Implement createAudioUrl
    this.createAudioUrl.mockImplementation((audio: Blob) => {
      const existingUrl = this._mockAudioUrls.get(audio);
      if (existingUrl) {
        return existingUrl;
      }
      
      const url = `mock://audio-url-${this._nextUrlId++}`;
      this._mockAudioUrls.set(audio, url);
      return url;
    });
    
    // Implement revokeAudioUrl
    this.revokeAudioUrl.mockImplementation((url: string) => {
      for (const [blob, mockUrl] of this._mockAudioUrls.entries()) {
        if (mockUrl === url) {
          this._mockAudioUrls.delete(blob);
          break;
        }
      }
    });
  }
  
  // Helper methods for simulation
  
  simulateBackgrounding() {
    this._isBackgrounded = true;
    
    // Check if we need to auto-pause recording
    if (this._recordingState.isRecording) {
      this._recordingState.isRecording = false;
      this._recordingState.error = new Error('Recording paused due to app backgrounding');
    }
    
    // Check if we need to auto-pause playback
    if (this._isPlaying) {
      this._isPlaying = false;
    }
  }
  
  simulateForegrounding() {
    this._isBackgrounded = false;
  }
  
  simulateAudioInterruption(type: 'call' | 'notification' | 'media' | null) {
    this._audioInterruption = type;
    
    // Auto-pause recording/playback on call interruption
    if (type === 'call') {
      if (this._recordingState.isRecording) {
        this._recordingState.isRecording = false;
        this._recordingState.error = new Error('Recording interrupted by call');
      }
      
      if (this._isPlaying) {
        this._isPlaying = false;
      }
    }
  }
  
  simulateAudioRoutingChange(routing: 'speaker' | 'headphones' | 'bluetooth' | 'earpiece') {
    this._audioRouting = routing;
  }
  
  setPermissionStatus(status: 'granted' | 'denied' | 'prompt') {
    this._permissionStatus = status;
  }
}

describe('AudioService Mobile Edge Cases', () => {
  let service: MockMobileAudioService;
  
  beforeEach(() => {
    service = new MockMobileAudioService();
  });
  
  describe('Permissions', () => {
    it('should handle denied microphone permission', async () => {
      service.setPermissionStatus('denied');
      
      await expect(service.startRecording())
        .rejects
        .toThrow('Microphone permission denied');
    });
    
    it('should prompt for permission when status is prompt', async () => {
      service.setPermissionStatus('prompt');
      
      // Should resolve with true as our mock simulates user accepting
      await expect(service.requestPermission())
        .resolves
        .toBe(true);
        
      // Next request should also succeed
      await expect(service.startRecording())
        .resolves
        .toBeUndefined();
    });
    
    it('should handle permission changes during operation', async () => {
      // Start with permission granted
      service.setPermissionStatus('granted');
      
      // Start recording
      await service.startRecording();
      
      // Revoke permission
      service.setPermissionStatus('denied');
      
      // Current recording continues as permission was checked at start
      await expect(service.stopRecording())
        .resolves
        .toBeTruthy();
        
      // New recording fails
      await expect(service.startRecording())
        .rejects
        .toThrow('Microphone permission denied');
    });
  });
  
  describe('App Lifecycle', () => {
    it('should handle app backgrounding during recording', async () => {
      // Start recording
      await service.startRecording();
      
      // Simulate app going to background
      service.simulateBackgrounding();
      
      // Check recording state - should be paused with error
      const state = service.getRecordingState();
      expect(state.isRecording).toBe(false);
      expect(state.error).toBeTruthy();
    });
    
    it('should prevent starting recording in background', async () => {
      // Put app in background
      service.simulateBackgrounding();
      
      // Try to start recording
      await expect(service.startRecording())
        .rejects
        .toThrow('Cannot start recording in background');
    });
    
    it('should prevent resuming recording in background', async () => {
      // Start and pause recording
      await service.startRecording();
      await service.pauseRecording();
      
      // Put app in background
      service.simulateBackgrounding();
      
      // Try to resume recording
      await expect(service.resumeRecording())
        .rejects
        .toThrow('Cannot resume recording in background');
    });
    
    it('should handle background/foreground transitions', async () => {
      // Start in foreground
      await service.startRecording();
      
      // Background
      service.simulateBackgrounding();
      
      // Recording should pause
      expect(service.getRecordingState().isRecording).toBe(false);
      
      // Foreground again
      service.simulateForegrounding();
      
      // Should be able to resume
      await service.resumeRecording();
      expect(service.getRecordingState().isRecording).toBe(true);
    });
  });
  
  describe('Audio Interruptions', () => {
    it('should handle call interruptions during recording', async () => {
      // Start recording
      await service.startRecording();
      
      // Simulate incoming call
      service.simulateAudioInterruption('call');
      
      // Recording should stop
      expect(service.getRecordingState().isRecording).toBe(false);
      expect(service.getRecordingState().error).toBeTruthy();
    });
    
    it('should handle call interruptions during playback', async () => {
      // Create audio for playback
      await service.startRecording();
      const audio = await service.stopRecording();
      
      // Start playback
      await service.playAudio(audio);
      
      // Simulate call interruption
      service.simulateAudioInterruption('call');
      
      // Playback should stop
      expect(service.isPlaying()).toBe(false);
    });
    
    it('should recover after interruption ends', async () => {
      // Simulate call interruption
      service.simulateAudioInterruption('call');
      
      // Try to record - should fail
      await service.startRecording().catch(() => {});
      expect(service.getRecordingState().isRecording).toBe(false);
      
      // End interruption
      service.simulateAudioInterruption(null);
      
      // Should now work
      await service.startRecording();
      expect(service.getRecordingState().isRecording).toBe(true);
    });
  });
  
  describe('Audio Routing', () => {
    it('should handle audio routing changes', async () => {
      // Default is speaker
      expect(service._audioRouting).toBe('speaker');
      
      // Change to headphones
      service.simulateAudioRoutingChange('headphones');
      
      // Create and play audio
      await service.startRecording();
      const audio = await service.stopRecording();
      
      // Console warning spy
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      // Play on headphones - should not warn
      await service.playAudio(audio);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      
      // Stop audio
      service.stopAudio();
      
      // Change to speaker
      service.simulateAudioRoutingChange('speaker');
      
      // Play on speaker - might warn about volume
      await service.playAudio(audio);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      // Cleanup
      consoleWarnSpy.mockRestore();
    });
  });
  
  describe('URL Management', () => {
    it('should create and revoke audio URLs', async () => {
      // Record audio
      await service.startRecording();
      const audio = await service.stopRecording();
      
      // Create URL
      const url = service.createAudioUrl(audio);
      expect(url).toMatch(/^mock:\/\/audio-url-/);
      
      // Creating URL for same blob should return same URL
      const url2 = service.createAudioUrl(audio);
      expect(url2).toBe(url);
      
      // Revoke URL
      service.revokeAudioUrl(url);
      
      // Creating URL again should give new URL
      const url3 = service.createAudioUrl(audio);
      expect(url3).not.toBe(url);
    });
  });
  
  describe('Concurrent Operations', () => {
    it('should prevent multiple recordings', async () => {
      // Start first recording
      await service.startRecording();
      
      // Try to start another recording
      await expect(service.startRecording())
        .rejects
        .toThrow('Already recording');
    });
    
    it('should handle stopping when not recording', async () => {
      await expect(service.stopRecording())
        .rejects
        .toThrow('Not currently recording');
    });
    
    it('should replace current audio playback with new playback', async () => {
      // Record audio
      await service.startRecording();
      const audio = await service.stopRecording();
      
      // Play audio
      await service.playAudio(audio);
      expect(service.isPlaying()).toBe(true);
      
      // Play again - should replace current playback
      const playSpy = jest.spyOn(service, 'playAudio');
      const stopSpy = jest.spyOn(service, 'stopAudio');
      
      await service.playAudio(audio);
      
      expect(stopSpy).toHaveBeenCalled();
      expect(service.isPlaying()).toBe(true);
      
      // Cleanup
      playSpy.mockRestore();
      stopSpy.mockRestore();
    });
  });
});
