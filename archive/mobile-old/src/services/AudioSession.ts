import { NativeModules, NativeEventEmitter, Platform } from "react-native";

const { AudioSessionModule } = NativeModules;

// Define event types for type safety
export enum AudioSessionInterruptionType {
  BEGAN = 1,
  ENDED = 2,
}

export enum AudioSessionRouteChangeReason {
  UNKNOWN = 0,
  NEW_DEVICE_AVAILABLE = 1,
  OLD_DEVICE_UNAVAILABLE = 2,
  CATEGORY_CHANGE = 3,
  OVERRIDE = 4,
  WAKE_FROM_SLEEP = 6,
  NO_SUITABLE_ROUTE = 7,
  ROUTE_CONFIG_CHANGE = 8,
}

export type AudioSessionMode = "recording" | "playback" | "playAndRecord";

export interface AudioRouteInfo {
  inputs: Array<{
    name: string;
    type: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
}

export interface AudioSessionInfo {
  sampleRate: number;
  outputChannels: number;
  inputChannels: number;
  bufferDuration: number;
  isInputAvailable: boolean;
  currentRoute: AudioRouteInfo;
}

export interface AudioSessionEvents {
  audioSessionInterruption: (event: {
    type: AudioSessionInterruptionType;
    options: number;
  }) => void;
  audioRouteChange: (event: {
    reason: AudioSessionRouteChangeReason;
    currentRoute: AudioRouteInfo;
  }) => void;
}

// Create event emitter
const audioSessionEventEmitter = new NativeEventEmitter(AudioSessionModule);

class AudioSession {
  /**
   * Configure the audio session for a specific mode
   * @param mode The audio session mode
   * @returns Promise resolving when configuration is complete
   */
  configureAudioSession(
    mode: AudioSessionMode = "playAndRecord",
  ): Promise<{ success: boolean }> {
    // Only call native module on iOS
    if (Platform.OS === "ios") {
      return AudioSessionModule.configureAudioSession(mode);
    }
    return Promise.resolve({ success: true });
  }

  /**
   * Deactivate the audio session
   * @returns Promise resolving when deactivation is complete
   */
  deactivateAudioSession(): Promise<{ success: boolean }> {
    if (Platform.OS === "ios") {
      return AudioSessionModule.deactivateAudioSession();
    }
    return Promise.resolve({ success: true });
  }

  /**
   * Get current audio session information
   * @returns Promise resolving with audio session info
   */
  getAudioSessionInfo(): Promise<AudioSessionInfo> {
    if (Platform.OS === "ios") {
      return AudioSessionModule.getAudioSessionInfo();
    }
    // Return default values for non-iOS platforms
    return Promise.resolve({
      sampleRate: 44100,
      outputChannels: 2,
      inputChannels: 1,
      bufferDuration: 0.005,
      isInputAvailable: true,
      currentRoute: {
        inputs: [],
        outputs: [],
      },
    });
  }

  /**
   * Add an event listener for audio session events
   * @param eventType The event type to listen for
   * @param listener The event callback
   * @returns A function to remove the listener
   */
  addListener<K extends keyof AudioSessionEvents>(
    eventType: K,
    listener: AudioSessionEvents[K],
  ): () => void {
    if (Platform.OS === "ios") {
      // Use unknown instead of any for better type safety
      const subscription = audioSessionEventEmitter.addListener(
        eventType,
        listener as unknown as (...args: unknown[]) => void,
      );
      return () => subscription.remove();
    }
    // Return no-op function for non-iOS platforms
    return () => {};
  }
}

export default new AudioSession();
