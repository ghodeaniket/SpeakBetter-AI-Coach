/**
 * Web Audio Service
 * Implements audio recording and playback functionality for web platform
 */

import {
  AudioService,
  AudioRecordingOptions,
  AudioRecordingState,
  AudioPlaybackOptions,
  AudioVisualizationData
} from '@speakbetter/core/services';

import {
  createAppError,
  ErrorCategory,
  ErrorCodes
} from '@speakbetter/core/models/error';

/**
 * Default audio recording options
 */
const DEFAULT_RECORDING_OPTIONS: AudioRecordingOptions = {
  format: 'audio/webm',
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
  maxDuration: 300, // 5 minutes
  autoStop: true,
  normalize: true,
  reduceNoise: false,
  silenceThreshold: 0.05
};

/**
 * Default audio playback options
 */
const DEFAULT_PLAYBACK_OPTIONS: AudioPlaybackOptions = {
  playbackRate: 1.0,
  volume: 1.0,
  loop: false
};

/**
 * Web implementation of the Audio Service
 * Uses Web Audio API and MediaRecorder for recording and playback
 */
export class WebAudioService implements AudioService {
  // Recording state
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private recordingInterval: number | null = null;
  private recordingState: AudioRecordingState = {
    isRecording: false,
    durationSeconds: 0,
    audioLevel: 0,
    isProcessing: false,
    isSilent: false,
    error: null
  };
  
  // Audio context for visualization and processing
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private freqData: Uint8Array = new Uint8Array();
  private timeData: Uint8Array = new Uint8Array();
  
  // Playback state
  private audioElement: HTMLAudioElement | null = null;
  private playbackUrl: string | null = null;
  
  constructor() {
    // Try to create audio context if supported
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }
    } catch (error) {
      console.warn('AudioContext is not supported in this browser');
    }
  }
  
  /**
   * Clean up resources when service is destroyed
   */
  destroy() {
    this.stopRecording().catch(console.error);
    this.stopAudio();
    
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
    }
    
    if (this.playbackUrl) {
      URL.revokeObjectURL(this.playbackUrl);
    }
  }
  
  /**
   * Request audio permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clean up stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  }
  
  /**
   * Check if audio recording is supported
   */
  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia && 
      window.MediaRecorder);
  }
  
  /**
   * Start audio recording
   */
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    if (this.recordingState.isRecording) {
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'Recording is already in progress',
        { category: ErrorCategory.AUDIO }
      );
    }
    
    // Merge options with defaults
    const recordingOptions = { ...DEFAULT_RECORDING_OPTIONS, ...options };
    
    try {
      // Check if recording is supported
      if (!this.isRecordingSupported()) {
        throw createAppError(
          ErrorCodes.AUDIO_RECORDING_NOT_SUPPORTED,
          'Audio recording is not supported in this browser',
          { category: ErrorCategory.AUDIO }
        );
      }
      
      // Request audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: recordingOptions.channels,
          sampleRate: recordingOptions.sampleRate,
          echoCancellation: recordingOptions.reduceNoise,
          noiseSuppression: recordingOptions.reduceNoise,
          autoGainControl: recordingOptions.normalize
        }
      });
      
      // Set up audio context and analyser for visualization
      if (this.audioContext) {
        const sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 1024;
        
        this.freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount);
        
        sourceNode.connect(this.analyserNode);
      }
      
      // Set up media recorder
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: recordingOptions.format || 'audio/webm'
      });
      
      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          recordingOptions.onDataAvailable?.(event.data);
        }
      };
      
      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Clear recording interval
        if (this.recordingInterval !== null) {
          window.clearInterval(this.recordingInterval);
          this.recordingInterval = null;
        }
        
        // Update recording state
        this.recordingState = {
          ...this.recordingState,
          isRecording: false,
          isProcessing: false
        };
      };
      
      // Handle recording error
      this.mediaRecorder.onerror = (event) => {
        const error = new Error('Recording error');
        
        this.recordingState = {
          ...this.recordingState,
          isRecording: false,
          error
        };
        
        throw createAppError(
          ErrorCodes.AUDIO_RECORDING_ERROR,
          'Error during recording',
          {
            category: ErrorCategory.AUDIO,
            originalError: error
          }
        );
      };
      
      // Start recording
      this.mediaRecorder.start(1000); // Collect data in 1-second chunks
      this.recordingStartTime = Date.now();
      
      // Set up interval to update recording state
      this.recordingInterval = window.setInterval(() => {
        const currentTime = Date.now();
        const durationSeconds = (currentTime - this.recordingStartTime) / 1000;
        
        // Update visualization data and audio level
        const visualizationData = this.getVisualizationData();
        const isSilent = visualizationData.averageLevel < (recordingOptions.silenceThreshold || 0);
        
        // Update recording state
        this.recordingState = {
          ...this.recordingState,
          durationSeconds,
          audioLevel: visualizationData.averageLevel,
          isSilent
        };
        
        // Auto-stop recording if maxDuration is reached
        if (recordingOptions.autoStop && 
            recordingOptions.maxDuration && 
            durationSeconds >= recordingOptions.maxDuration) {
          this.stopRecording().catch(console.error);
        }
      }, 100);
      
      // Update recording state
      this.recordingState = {
        isRecording: true,
        durationSeconds: 0,
        audioLevel: 0,
        isProcessing: false,
        isSilent: false,
        error: null
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      
      const appError = createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        error instanceof Error ? error.message : 'Failed to start recording',
        {
          category: ErrorCategory.AUDIO,
          originalError: error as Error
        }
      );
      
      this.recordingState = {
        ...this.recordingState,
        isRecording: false,
        error: appError
      };
      
      throw appError;
    }
  }
  
  /**
   * Stop audio recording
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'No active recording to stop',
        { category: ErrorCategory.AUDIO }
      );
    }
    
    try {
      // Update state to processing
      this.recordingState = {
        ...this.recordingState,
        isProcessing: true
      };
      
      // Create a promise that resolves when recording stops
      const recordingStoppedPromise = new Promise<Blob>((resolve) => {
        if (!this.mediaRecorder) return resolve(new Blob([]));
        
        this.mediaRecorder.onstop = () => {
          // Stop all tracks in the stream
          this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
          
          // Create final blob from chunks
          const blob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType 
          });
          
          // Clear recording interval
          if (this.recordingInterval !== null) {
            window.clearInterval(this.recordingInterval);
            this.recordingInterval = null;
          }
          
          // Update recording state
          this.recordingState = {
            ...this.recordingState,
            isRecording: false,
            isProcessing: false
          };
          
          resolve(blob);
        };
      });
      
      // Stop the media recorder
      this.mediaRecorder.stop();
      
      // Wait for the recording to be fully stopped
      return await recordingStoppedPromise;
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      // Update recording state
      this.recordingState = {
        ...this.recordingState,
        isRecording: false,
        isProcessing: false,
        error: error as Error
      };
      
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'Failed to stop recording',
        {
          category: ErrorCategory.AUDIO,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Pause audio recording
   */
  async pauseRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'No active recording to pause',
        { category: ErrorCategory.AUDIO }
      );
    }
    
    try {
      this.mediaRecorder.pause();
      
      // Update recording state
      this.recordingState = {
        ...this.recordingState,
        isRecording: false
      };
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'Failed to pause recording',
        {
          category: ErrorCategory.AUDIO,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Resume audio recording
   */
  async resumeRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'No paused recording to resume',
        { category: ErrorCategory.AUDIO }
      );
    }
    
    try {
      this.mediaRecorder.resume();
      
      // Update recording state
      this.recordingState = {
        ...this.recordingState,
        isRecording: true
      };
    } catch (error) {
      console.error('Error resuming recording:', error);
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'Failed to resume recording',
        {
          category: ErrorCategory.AUDIO,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Cancel audio recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        // Stop all tracks in the stream
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Stop the media recorder
        this.mediaRecorder.stop();
        
        // Clear recording interval
        if (this.recordingInterval !== null) {
          window.clearInterval(this.recordingInterval);
          this.recordingInterval = null;
        }
        
        // Clear chunks
        this.audioChunks = [];
        
        // Update recording state
        this.recordingState = {
          isRecording: false,
          durationSeconds: 0,
          audioLevel: 0,
          isProcessing: false,
          isSilent: false,
          error: null
        };
      } catch (error) {
        console.error('Error canceling recording:', error);
      }
    }
  }
  
  /**
   * Get audio recording state
   */
  getRecordingState(): AudioRecordingState {
    return this.recordingState;
  }
  
  /**
   * Play audio
   */
  async playAudio(audio: Blob | string, options: AudioPlaybackOptions = {}): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopAudio();
      
      // Create new audio element
      this.audioElement = new Audio();
      
      // Set playback options
      const playbackOptions = { ...DEFAULT_PLAYBACK_OPTIONS, ...options };
      this.audioElement.volume = playbackOptions.volume;
      this.audioElement.playbackRate = playbackOptions.playbackRate;
      this.audioElement.loop = playbackOptions.loop;
      
      // Set up event listeners
      if (playbackOptions.onEnded) {
        this.audioElement.addEventListener('ended', playbackOptions.onEnded);
      }
      
      if (playbackOptions.onTimeUpdate) {
        this.audioElement.addEventListener('timeupdate', () => {
          if (this.audioElement) {
            playbackOptions.onTimeUpdate?.(this.audioElement.currentTime);
          }
        });
      }
      
      // Set the audio source
      if (typeof audio === 'string') {
        this.audioElement.src = audio;
      } else {
        if (this.playbackUrl) {
          URL.revokeObjectURL(this.playbackUrl);
        }
        
        this.playbackUrl = URL.createObjectURL(audio);
        this.audioElement.src = this.playbackUrl;
      }
      
      // Load and play the audio
      await this.audioElement.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      throw createAppError(
        ErrorCodes.AUDIO_PLAYBACK_ERROR,
        'Failed to play audio',
        {
          category: ErrorCategory.AUDIO,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Pause audio playback
   */
  pauseAudio(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }
  
  /**
   * Stop audio playback
   */
  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      
      // Remove event listeners
      this.audioElement.removeEventListener('ended', () => {});
      this.audioElement.removeEventListener('timeupdate', () => {});
      
      this.audioElement = null;
    }
  }
  
  /**
   * Get current playback time
   */
  getPlaybackTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }
  
  /**
   * Set current playback time
   */
  setPlaybackTime(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }
  
  /**
   * Get total audio duration
   */
  getAudioDuration(): number {
    return this.audioElement ? 
      (isNaN(this.audioElement.duration) ? 0 : this.audioElement.duration) 
      : 0;
  }
  
  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return !!(this.audioElement && !this.audioElement.paused);
  }
  
  /**
   * Get audio visualization data
   */
  getVisualizationData(): AudioVisualizationData {
    if (this.analyserNode) {
      // Get frequency data
      this.analyserNode.getByteFrequencyData(this.freqData);
      
      // Get waveform data
      this.analyserNode.getByteTimeDomainData(this.timeData);
      
      // Calculate average level
      let sum = 0;
      for (let i = 0; i < this.freqData.length; i++) {
        sum += this.freqData[i];
      }
      const averageLevel = sum / this.freqData.length / 255;
      
      // Find peak level
      let peak = 0;
      for (let i = 0; i < this.freqData.length; i++) {
        if (this.freqData[i] > peak) {
          peak = this.freqData[i];
        }
      }
      const peakLevel = peak / 255;
      
      return {
        frequencyData: this.freqData,
        timeData: this.timeData,
        averageLevel,
        peakLevel
      };
    }
    
    // Return empty data if analyser is not available
    return {
      frequencyData: new Uint8Array(),
      timeData: new Uint8Array(),
      averageLevel: 0,
      peakLevel: 0
    };
  }
  
  /**
   * Convert audio format
   */
  async convertFormat(audio: Blob, targetFormat: string): Promise<Blob> {
    if (!this.audioContext) {
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_NOT_SUPPORTED,
        'Audio context is not supported in this browser',
        { category: ErrorCategory.AUDIO }
      );
    }
    
    try {
      // Create array buffer from blob
      const arrayBuffer = await audio.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create offline audio context for rendering
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Create buffer source
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      
      // Start rendering
      source.start(0);
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to WAV format
      const wavBlob = this.audioBufferToWav(renderedBuffer);
      
      if (targetFormat === 'audio/wav') {
        return wavBlob;
      }
      
      // For other formats, we would need to add more conversion logic here
      // This is just a simple implementation for WAV
      
      return wavBlob;
    } catch (error) {
      console.error('Error converting audio format:', error);
      throw createAppError(
        ErrorCodes.AUDIO_RECORDING_ERROR,
        'Failed to convert audio format',
        {
          category: ErrorCategory.AUDIO,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Create audio URL from blob
   */
  createAudioUrl(audio: Blob): string {
    return URL.createObjectURL(audio);
  }
  
  /**
   * Release audio URL
   */
  revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
  
  /**
   * Helper function to convert AudioBuffer to WAV blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numChannels === 2) {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const dataLength = result.length * (bitDepth / 8);
    const buffer2 = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer2);
    
    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    
    // FMT sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    
    // Data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write PCM data
    this.floatTo16BitPCM(view, 44, result);
    
    return new Blob([buffer2], { type: 'audio/wav' });
  }
  
  /**
   * Helper function to write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  /**
   * Helper function to interleave two float32 arrays
   */
  private interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    
    let index = 0;
    for (let i = 0; i < inputL.length; i++) {
      result[index++] = inputL[i];
      result[index++] = inputR[i];
    }
    
    return result;
  }
  
  /**
   * Helper function to convert float32 to 16-bit PCM
   */
  private floatTo16BitPCM(
    output: DataView, 
    offset: number, 
    input: Float32Array
  ): void {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
}
