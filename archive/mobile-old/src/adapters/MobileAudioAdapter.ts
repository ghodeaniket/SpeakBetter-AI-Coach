import { 
  AudioService, 
  AudioRecordingOptions, 
  AudioRecordingState, 
  AudioPlaybackOptions, 
  AudioVisualizationData 
} from '@speakbetter/core/services/audio';
import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecorderPlayer, { 
  AudioEncoderAndroidType, 
  AudioSourceAndroidType, 
  AVEncoderAudioQualityIOSType, 
  AVEncodingOption 
} from 'react-native-audio-recorder-player';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import * as Haptics from 'expo-haptics';

/**
 * Mobile implementation of the AudioService interface
 */
export class MobileAudioAdapter implements AudioService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private recordingState: AudioRecordingState;
  private audioFile: string | null = null;
  private visualizationData: AudioVisualizationData;
  private dataAvailableCallback: ((data: Blob) => void) | null = null;
  private volumeSubscription: any = null;
  private metersUpdateInterval: any = null;
  private recordingTimer: any = null;
  private cachePath = `${RNFS.CachesDirectoryPath}/speakbetter-recordings`;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.1); // 100ms update interval
    
    this.recordingState = {
      isRecording: false,
      durationSeconds: 0,
      audioLevel: 0,
      isProcessing: false,
      isSilent: false,
      error: null,
    };
    
    this.visualizationData = {
      frequencyData: new Uint8Array(0),
      timeData: new Uint8Array(0),
      averageLevel: 0,
      peakLevel: 0,
    };
    
    // Make sure cache directory exists
    RNFS.mkdir(this.cachePath, { NSURLIsExcludedFromBackupKey: true }).catch(err => {
      console.warn('Failed to create audio cache directory', err);
    });
  }
  
  /**
   * Request audio permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        
        return (
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
          grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // iOS will request permission automatically when recording starts
        return true;
      }
    } catch (err) {
      console.error('Failed to request audio permissions', err);
      this.recordingState.error = err instanceof Error ? err : new Error('Permission request failed');
      return false;
    }
  }
  
  /**
   * Check if audio recording is supported
   */
  isRecordingSupported(): boolean {
    return true; // Generally supported on all mobile devices
  }
  
  /**
   * Start audio recording with retry mechanism
   */
  async startRecording(options?: AudioRecordingOptions): Promise<void> {
    let attempts = 0;
    const maxAttempts = 3;
    
    const attemptRecording = async (): Promise<void> => {
      try {
        // Store data available callback
        this.dataAvailableCallback = options?.onDataAvailable || null;
        
        // Reset state
        this.recordingState = {
          isRecording: false,
          durationSeconds: 0,
          audioLevel: 0,
          isProcessing: false,
          isSilent: false,
          error: null,
        };
        
        // Generate filename with timestamp
        const timestamp = new Date().getTime();
        this.audioFile = `${this.cachePath}/recording_${timestamp}.m4a`;
        
        // Audio recording settings
        const audioSet = {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: options?.channels || 1,
          AVFormatIDKeyIOS: AVEncodingOption.aac,
        };
        
        // Check if we have necessary permissions (Android needs explicit check)
        if (Platform.OS === 'android') {
          const hasPermission = await this.requestPermission();
          if (!hasPermission) {
            throw new Error('Recording permission denied');
          }
        }
        
        // Start recording
        await this.audioRecorderPlayer.startRecorder(this.audioFile, audioSet);
        this.recordingState.isRecording = true;
        
        // Reset error state on success
        this.recordingState.error = null;
        
        // Add haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        // Set up volume meter subscription
        this.volumeSubscription = this.audioRecorderPlayer.addRecordBackListener((e) => {
          this.recordingState.durationSeconds = e.currentPosition / 1000;
          this.recordingState.audioLevel = Math.min(e.currentMetering || 0, 1);
          
          // Update visualization data
          this.generateDummyVisualizationData(e.currentMetering || 0);
          
          // Check for silence
          this.recordingState.isSilent = e.currentMetering < (options?.silenceThreshold || 0.05);
          
          // Auto-stop if max duration is set
          if (options?.autoStop && options.maxDuration && this.recordingState.durationSeconds >= options.maxDuration) {
            this.stopRecording().catch(console.error);
          }
        });
        
        // Set up auto-stop timer if needed
        if (options?.autoStop && options.maxDuration) {
          this.recordingTimer = setTimeout(() => {
            this.stopRecording().catch(console.error);
          }, options.maxDuration * 1000);
        }
      } catch (err) {
        attempts++;
        console.error(`Failed to start recording (attempt ${attempts}/${maxAttempts})`, err);
        
        // Cleanup any partial setup before retrying
        this.cleanupRecordingResources();
        
        if (attempts < maxAttempts) {
          console.log(`Retrying recording in 300ms... (attempt ${attempts + 1}/${maxAttempts})`);
          // Wait briefly before retry
          await new Promise(resolve => setTimeout(resolve, 300));
          return attemptRecording();
        }
        
        // If all attempts failed, update error state and throw
        this.recordingState.error = err instanceof Error 
          ? err 
          : new Error(`Failed to start recording after ${maxAttempts} attempts`);
        throw this.recordingState.error;
      }
    };
    
    return attemptRecording();
  }
  
  /**
   * Clean up recording resources
   */
  private cleanupRecordingResources(): void {
    // Clean up subscription if exists
    if (this.volumeSubscription) {
      this.audioRecorderPlayer.removeRecordBackListener();
      this.volumeSubscription = null;
    }
    
    // Clean up timer if exists
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Try to stop any ongoing recording
    try {
      this.audioRecorderPlayer.stopRecorder().catch(() => {
        // Ignore errors here as we're already in cleanup
      });
    } catch (e) {
      // Ignore errors in cleanup
    }
    
    // Reset recording state
    this.recordingState.isRecording = false;
    
    // Delete any partially created file
    if (this.audioFile) {
      RNFS.unlink(this.audioFile).catch(() => {
        // Ignore errors here as file might not exist
      });
    }
  }
  
  /**
   * Stop audio recording with retry mechanism
   */
  async stopRecording(): Promise<Blob> {
    let attempts = 0;
    const maxAttempts = 3;
    
    const attemptStopRecording = async (): Promise<Blob> => {
      try {
        // Stop recording
        const result = await this.audioRecorderPlayer.stopRecorder();
        this.recordingState.isRecording = false;
        
        // Add haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Clean up subscription and timer
        if (this.volumeSubscription) {
          this.audioRecorderPlayer.removeRecordBackListener();
          this.volumeSubscription = null;
        }
        
        if (this.recordingTimer) {
          clearTimeout(this.recordingTimer);
          this.recordingTimer = null;
        }
        
        // Convert file to blob
        if (this.audioFile) {
          this.recordingState.isProcessing = true;
          
          // Check if file exists before trying to read it
          const fileExists = await RNFS.exists(this.audioFile);
          if (!fileExists) {
            throw new Error('Recording file not found');
          }
          
          try {
            const fileData = await RNFS.readFile(this.audioFile, 'base64');
            const blob = this.base64ToBlob(fileData, 'audio/m4a');
            
            // Callback with blob if needed
            if (this.dataAvailableCallback) {
              this.dataAvailableCallback(blob);
            }
            
            this.recordingState.isProcessing = false;
            return blob;
          } catch (readError) {
            console.error('Failed to read audio file', readError);
            throw new Error('Failed to process audio recording');
          }
        } else {
          throw new Error('No audio file recorded');
        }
      } catch (err) {
        attempts++;
        console.error(`Failed to stop recording (attempt ${attempts}/${maxAttempts})`, err);
        
        if (attempts < maxAttempts) {
          console.log(`Retrying to stop recording in 300ms... (attempt ${attempts + 1}/${maxAttempts})`);
          // Wait briefly before retry
          await new Promise(resolve => setTimeout(resolve, 300));
          return attemptStopRecording();
        }
        
        // If all attempts failed, clean up and throw error
        this.cleanupRecordingResources();
        this.recordingState.error = err instanceof Error 
          ? err 
          : new Error(`Failed to stop recording after ${maxAttempts} attempts`);
        throw this.recordingState.error;
      }
    };
    
    return attemptStopRecording();
  }
  
  /**
   * Pause audio recording
   */
  async pauseRecording(): Promise<void> {
    try {
      await this.audioRecorderPlayer.pauseRecorder();
    } catch (err) {
      console.error('Failed to pause recording', err);
      this.recordingState.error = err instanceof Error ? err : new Error('Failed to pause recording');
      throw this.recordingState.error;
    }
  }
  
  /**
   * Resume audio recording
   */
  async resumeRecording(): Promise<void> {
    try {
      await this.audioRecorderPlayer.resumeRecorder();
    } catch (err) {
      console.error('Failed to resume recording', err);
      this.recordingState.error = err instanceof Error ? err : new Error('Failed to resume recording');
      throw this.recordingState.error;
    }
  }
  
  /**
   * Cancel audio recording
   */
  cancelRecording(): void {
    try {
      this.audioRecorderPlayer.stopRecorder().catch(() => {
        // Ignore errors during cancellation
      });
      this.recordingState.isRecording = false;
      
      // Use the cleanup method to ensure all resources are released
      this.cleanupRecordingResources();
      
      // Reset error state since this is a user-initiated cancellation
      this.recordingState.error = null;
    } catch (e) {
      console.warn('Error during recording cancellation', e);
      // We don't throw or set error state here since cancellation should always "succeed"
    }
  }
  
  /**
   * Get the last recording file path
   */
  getLastRecordingPath(): string | null {
    return this.audioFile;
  }
  
  /**
   * Clean up temporary files
   */
  async cleanupTemporaryFiles(): Promise<void> {
    try {
      // Get all files in the cache directory
      const files = await RNFS.readDir(this.cachePath);
      
      // Keep track of current recording file
      const currentRecording = this.audioFile;
      
      // Delete all files except the current recording
      for (const file of files) {
        if (file.path !== currentRecording) {
          await RNFS.unlink(file.path).catch(() => {
            // Ignore individual file deletion errors
          });
        }
      }
    } catch (e) {
      console.warn('Failed to clean up temporary files', e);
    }
  }
  
  /**
   * Get audio recording state
   */
  getRecordingState(): AudioRecordingState {
    return { ...this.recordingState };
  }
  
  /**
   * Play audio
   */
  async playAudio(audio: Blob | string, options?: AudioPlaybackOptions): Promise<void> {
    try {
      let filePath = '';
      
      if (typeof audio === 'string') {
        // String could be a URL or file path
        if (audio.startsWith('http')) {
          filePath = audio;
        } else {
          filePath = audio;
        }
      } else {
        // Convert blob to file
        filePath = `${this.cachePath}/playback_${new Date().getTime()}.m4a`;
        const base64Data = await this.blobToBase64(audio);
        await RNFS.writeFile(filePath, base64Data, 'base64');
      }
      
      // Set playback options
      if (options) {
        if (options.playbackRate) {
          this.audioRecorderPlayer.setPlaySpeed(options.playbackRate);
        }
        if (options.volume !== undefined) {
          this.audioRecorderPlayer.setVolume(options.volume);
        }
      }
      
      // Start playback
      await this.audioRecorderPlayer.startPlayer(filePath);
      
      // Set up event listeners
      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if (options?.onTimeUpdate) {
          options.onTimeUpdate(e.currentPosition / 1000);
        }
        
        // Call onEnded when finished
        if (e.currentPosition === e.duration) {
          if (options?.onEnded) {
            options.onEnded();
          }
          this.audioRecorderPlayer.removePlayBackListener();
        }
        
        // Loop if needed
        if (options?.loop && e.currentPosition === e.duration) {
          this.audioRecorderPlayer.startPlayer(filePath).catch(console.error);
        }
      });
    } catch (err) {
      console.error('Failed to play audio', err);
      throw err instanceof Error ? err : new Error('Failed to play audio');
    }
  }
  
  /**
   * Pause audio playback
   */
  pauseAudio(): void {
    this.audioRecorderPlayer.pausePlayer().catch(console.error);
  }
  
  /**
   * Stop audio playback
   */
  stopAudio(): void {
    this.audioRecorderPlayer.stopPlayer().catch(console.error);
    this.audioRecorderPlayer.removePlayBackListener();
  }
  
  /**
   * Get current playback time
   */
  getPlaybackTime(): number {
    return this.audioRecorderPlayer.getCurrentPositionSec() || 0;
  }
  
  /**
   * Set current playback time
   */
  setPlaybackTime(time: number): void {
    this.audioRecorderPlayer.seekToPlayer(time * 1000).catch(console.error);
  }
  
  /**
   * Get total audio duration
   */
  getAudioDuration(): number {
    return this.audioRecorderPlayer.getDurationSec() || 0;
  }
  
  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return false; // TODO: Implement once the library provides a method for this
  }
  
  /**
   * Get audio visualization data
   */
  getVisualizationData(): AudioVisualizationData {
    return { ...this.visualizationData };
  }
  
  /**
   * Convert audio format (using FFmpeg)
   */
  async convertFormat(audio: Blob, targetFormat: string): Promise<Blob> {
    try {
      // Save blob to temp file
      const inPath = `${this.cachePath}/convert_in_${new Date().getTime()}.m4a`;
      const outPath = `${this.cachePath}/convert_out_${new Date().getTime()}.${targetFormat.split('/')[1]}`;
      
      const base64Data = await this.blobToBase64(audio);
      await RNFS.writeFile(inPath, base64Data, 'base64');
      
      // Use FFmpeg to convert
      await FFmpegKit.execute(`-i ${inPath} -c:a aac ${outPath}`);
      
      // Read output file
      const outputData = await RNFS.readFile(outPath, 'base64');
      const outputBlob = this.base64ToBlob(outputData, targetFormat);
      
      // Clean up temp files
      RNFS.unlink(inPath).catch(console.error);
      RNFS.unlink(outPath).catch(console.error);
      
      return outputBlob;
    } catch (err) {
      console.error('Failed to convert audio format', err);
      throw err instanceof Error ? err : new Error('Failed to convert audio format');
    }
  }
  
  /**
   * Create audio URL from blob
   */
  createAudioUrl(audio: Blob): string {
    // In React Native, we can't create object URLs directly
    // Instead, we'll save to a file and return the file path
    const filePath = `${this.cachePath}/url_${new Date().getTime()}.${audio.type.split('/')[1] || 'mp4'}`;
    
    // This is async, but we can't make this method async without changing the interface
    // So we'll do it in the background and return the file path immediately
    this.blobToBase64(audio)
      .then(base64Data => RNFS.writeFile(filePath, base64Data, 'base64'))
      .catch(console.error);
    
    return filePath;
  }
  
  /**
   * Release audio URL
   */
  revokeAudioUrl(url: string): void {
    // Delete the file
    if (url.startsWith(this.cachePath)) {
      RNFS.unlink(url).catch(console.error);
    }
  }
  
  // Helper methods
  
  /**
   * Generate dummy visualization data based on audio level
   */
  private generateDummyVisualizationData(level: number): void {
    // For Phase 5B, we'll use a simplified approach
    // In a real app, we'd process the actual audio data
    
    const normalizedLevel = Math.max(0, Math.min(1, level));
    const freqLength = 32;
    const timeLength = 64;
    
    // Create frequency data with random values based on level
    const frequencyData = new Uint8Array(freqLength);
    for (let i = 0; i < freqLength; i++) {
      frequencyData[i] = Math.floor(normalizedLevel * 255 * (0.5 + Math.random() * 0.5));
    }
    
    // Create time domain data
    const timeData = new Uint8Array(timeLength);
    for (let i = 0; i < timeLength; i++) {
      const phase = (i / timeLength) * Math.PI * 2;
      timeData[i] = 128 + Math.sin(phase) * normalizedLevel * 127;
    }
    
    this.visualizationData = {
      frequencyData,
      timeData,
      averageLevel: normalizedLevel,
      peakLevel: normalizedLevel * (0.8 + Math.random() * 0.2),
    };
  }
  
  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Convert base64 to blob
   */
  private base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type });
  }
}
