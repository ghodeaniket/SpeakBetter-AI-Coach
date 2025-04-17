import { useEffect, useState, useRef } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { AudioSessionModule } = NativeModules;

/**
 * Options for the useAudioLevels hook
 */
interface UseAudioLevelsOptions {
  /**
   * Number of levels to keep in history (default: 50)
   */
  historySize?: number;
  
  /**
   * Smoothing factor for level changes (0-1, default: 0.3)
   * Lower values = more responsive, higher values = smoother
   */
  smoothingFactor?: number;
  
  /**
   * Whether the hook should automatically start listening (default: true)
   */
  autoStart?: boolean;
}

/**
 * Custom hook that provides real-time audio level data from the device microphone
 */
export const useAudioLevels = (options: UseAudioLevelsOptions = {}) => {
  const {
    historySize = 50,
    smoothingFactor = 0.3,
    autoStart = true,
  } = options;
  
  // Current audio level (normalized 0-1)
  const [currentLevel, setCurrentLevel] = useState(0);
  
  // History of audio levels for visualization
  const [levelHistory, setLevelHistory] = useState<number[]>(Array(historySize).fill(0));
  
  // Reference to track if we're currently listening for levels
  const isListeningRef = useRef(false);
  
  // Listener cleanup function reference
  const cleanupListenerRef = useRef<(() => void) | null>(null);

  /**
   * Start listening for audio level changes
   */
  const startListening = async () => {
    if (isListeningRef.current) return;
    
    try {
      // Only available on iOS currently
      if (Platform.OS === 'ios' && AudioSessionModule?.startAudioLevelMonitoring) {
        await AudioSessionModule.startAudioLevelMonitoring();
        isListeningRef.current = true;
      }
    } catch (error) {
      console.error('Failed to start audio level monitoring:', error);
    }
  };

  /**
   * Stop listening for audio level changes
   */
  const stopListening = async () => {
    if (!isListeningRef.current) return;
    
    try {
      if (Platform.OS === 'ios' && AudioSessionModule?.stopAudioLevelMonitoring) {
        await AudioSessionModule.stopAudioLevelMonitoring();
      }
    } catch (error) {
      console.error('Failed to stop audio level monitoring:', error);
    } finally {
      isListeningRef.current = false;
    }
  };

  /**
   * Reset the audio level history
   */
  const resetLevels = () => {
    setCurrentLevel(0);
    setLevelHistory(Array(historySize).fill(0));
  };

  // Set up the event listeners
  useEffect(() => {
    if (!AudioSessionModule) {
      console.warn('AudioSessionModule not available');
      return;
    }

    const eventEmitter = new NativeEventEmitter(AudioSessionModule);
    
    // Listen for audio level updates
    const subscription = eventEmitter.addListener(
      'audioLevelChanged',
      (event) => {
        const { level } = event;
        
        // Normalize the level (usually comes in dB, convert to 0-1 range)
        // Different devices may have different ranges, so we normalize it
        // RMS levels are usually negative dB, with 0 being max and -160 being silence
        const normalizedLevel = Math.max(0, Math.min(1, (level + 60) / 60));
        
        // Apply smoothing
        setCurrentLevel((prevLevel) => 
          prevLevel * smoothingFactor + normalizedLevel * (1 - smoothingFactor)
        );
        
        // Update history
        setLevelHistory((prevHistory) => {
          const newHistory = [...prevHistory, normalizedLevel];
          if (newHistory.length > historySize) {
            newHistory.shift();
          }
          return newHistory;
        });
      }
    );
    
    cleanupListenerRef.current = () => {
      subscription.remove();
    };
    
    // Auto-start if enabled
    if (autoStart) {
      startListening();
    }
    
    // Cleanup
    return () => {
      stopListening();
      subscription.remove();
    };
  }, [historySize, smoothingFactor, autoStart]);

  return {
    currentLevel,
    levelHistory,
    isListening: isListeningRef.current,
    startListening,
    stopListening,
    resetLevels,
  };
};

export default useAudioLevels;
