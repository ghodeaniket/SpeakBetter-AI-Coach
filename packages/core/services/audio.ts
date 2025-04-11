/**
 * Audio Service Interface
 * Provides audio recording and playback functionality
 * 
 * Implementation Notes:
 * - Web: Uses MediaRecorder API and AudioContext
 * - Mobile: 
 *   - iOS: AVAudioRecorder/AVAudioPlayer or react-native-audio-recorder-player
 *   - Android: MediaRecorder/MediaPlayer or equivalent React Native libraries
 * - Be mindful of background mode restrictions on mobile platforms
 * - Sample rate and encoding options vary across platforms
 * - Error handling should account for permission changes during recording
 * - Memory management is critical for long recordings
 */

/**
 * Audio recording options
 */
export interface AudioRecordingOptions {
  /**
   * Audio format (e.g., 'audio/webm', 'audio/mp4')
   */
  format?: string;
  
  /**
   * Sample rate in Hz
   */
  sampleRate?: number;
  
  /**
   * Number of channels (1 for mono, 2 for stereo)
   */
  channels?: number;
  
  /**
   * Bit depth
   */
  bitDepth?: number;
  
  /**
   * Maximum recording duration in seconds (0 for unlimited)
   */
  maxDuration?: number;
  
  /**
   * Whether to automatically stop recording after maxDuration
   */
  autoStop?: boolean;
  
  /**
   * Whether to normalize audio levels
   */
  normalize?: boolean;
  
  /**
   * Whether to reduce noise
   */
  reduceNoise?: boolean;
  
  /**
   * Silence detection threshold (0.0 to 1.0)
   */
  silenceThreshold?: number;
  
  /**
   * Function called when audio data is available
   */
  onDataAvailable?: (data: Blob) => void;
}

/**
 * Audio recording state
 */
export interface AudioRecordingState {
  /**
   * Whether recording is in progress
   */
  isRecording: boolean;
  
  /**
   * Current recording duration in seconds
   */
  durationSeconds: number;
  
  /**
   * Current audio level (0.0 to 1.0)
   */
  audioLevel: number;
  
  /**
   * Whether audio is being processed
   */
  isProcessing: boolean;
  
  /**
   * Whether audio is currently silent
   */
  isSilent: boolean;
  
  /**
   * Any error that occurred during recording
   */
  error: Error | null;
}

/**
 * Audio playback options
 */
export interface AudioPlaybackOptions {
  /**
   * Playback rate (0.5 to 2.0)
   */
  playbackRate?: number;
  
  /**
   * Volume (0.0 to 1.0)
   */
  volume?: number;
  
  /**
   * Whether to loop playback
   */
  loop?: boolean;
  
  /**
   * Function called when playback ends
   */
  onEnded?: () => void;
  
  /**
   * Function called when playback time updates
   */
  onTimeUpdate?: (currentTime: number) => void;
}

/**
 * Audio visualization data
 */
export interface AudioVisualizationData {
  /**
   * Frequency data array
   */
  frequencyData: Uint8Array;
  
  /**
   * Time domain data array
   */
  timeData: Uint8Array;
  
  /**
   * Average audio level (0.0 to 1.0)
   */
  averageLevel: number;
  
  /**
   * Peak audio level (0.0 to 1.0)
   */
  peakLevel: number;
}

/**
 * Audio service interface
 * Platform-agnostic interface for audio operations
 */
export interface AudioService {
  /**
   * Request audio permission
   */
  requestPermission(): Promise<boolean>;
  
  /**
   * Check if audio recording is supported
   */
  isRecordingSupported(): boolean;
  
  /**
   * Start audio recording
   */
  startRecording(options?: AudioRecordingOptions): Promise<void>;
  
  /**
   * Stop audio recording
   */
  stopRecording(): Promise<Blob>;
  
  /**
   * Pause audio recording
   */
  pauseRecording(): Promise<void>;
  
  /**
   * Resume audio recording
   */
  resumeRecording(): Promise<void>;
  
  /**
   * Cancel audio recording
   */
  cancelRecording(): void;
  
  /**
   * Get audio recording state
   */
  getRecordingState(): AudioRecordingState;
  
  /**
   * Play audio
   */
  playAudio(audio: Blob | string, options?: AudioPlaybackOptions): Promise<void>;
  
  /**
   * Pause audio playback
   */
  pauseAudio(): void;
  
  /**
   * Stop audio playback
   */
  stopAudio(): void;
  
  /**
   * Get current playback time
   */
  getPlaybackTime(): number;
  
  /**
   * Set current playback time
   */
  setPlaybackTime(time: number): void;
  
  /**
   * Get total audio duration
   */
  getAudioDuration(): number;
  
  /**
   * Check if audio is playing
   */
  isPlaying(): boolean;
  
  /**
   * Get audio visualization data
   */
  getVisualizationData(): AudioVisualizationData;
  
  /**
   * Convert audio format
   */
  convertFormat(audio: Blob, targetFormat: string): Promise<Blob>;
  
  /**
   * Create audio URL from blob
   */
  createAudioUrl(audio: Blob): string;
  
  /**
   * Release audio URL
   */
  revokeAudioUrl(url: string): void;
}
