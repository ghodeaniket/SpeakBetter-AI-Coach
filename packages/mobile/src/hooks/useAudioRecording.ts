import { useState, useEffect, useRef, useCallback } from 'react';
import { ServiceFactory } from '../adapters/ServiceFactory';
import { AudioRecordingOptions, AudioRecordingState, AudioVisualizationData } from '@speakbetter/core/services/audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface UseAudioRecordingResult {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  audioLevel: number;
  error: Error | null;
  visualizationData: AudioVisualizationData;
  startRecording: (options?: AudioRecordingOptions) => Promise<void>;
  stopRecording: () => Promise<Blob>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  cancelRecording: () => void;
}

/**
 * Hook for managing audio recording
 */
export const useAudioRecording = (options?: AudioRecordingOptions): UseAudioRecordingResult => {
  // Get the audio service
  const audioService = useRef(ServiceFactory.getAudioService());
  
  // State
  const [recordingState, setRecordingState] = useState<AudioRecordingState>({
    isRecording: false,
    durationSeconds: 0,
    audioLevel: 0,
    isProcessing: false,
    isSilent: false,
    error: null,
  });
  
  const [visualizationData, setVisualizationData] = useState<AudioVisualizationData>({
    frequencyData: new Uint8Array(0),
    timeData: new Uint8Array(0),
    averageLevel: 0,
    peakLevel: 0,
  });
  
  // Timer for updating visualization
  const visualizationTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Start visualization timer
  const startVisualizationTimer = useCallback(() => {
    if (visualizationTimer.current) {
      clearInterval(visualizationTimer.current);
    }
    
    visualizationTimer.current = setInterval(() => {
      if (audioService.current) {
        const data = audioService.current.getVisualizationData();
        setVisualizationData(data);
      }
    }, 100); // Update every 100ms
  }, []);
  
  // Stop visualization timer
  const stopVisualizationTimer = useCallback(() => {
    if (visualizationTimer.current) {
      clearInterval(visualizationTimer.current);
      visualizationTimer.current = null;
    }
  }, []);
  
  // Request permissions and setup cleanup on mount
  useEffect(() => {
    // Request permissions on component mount
    audioService.current.requestPermission().catch(err => {
      setRecordingState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to request audio permissions'),
      }));
    });
    
    return () => {
      stopVisualizationTimer();
      
      // Enhanced cleanup to avoid memory leaks
      if (recordingState.isRecording || recordingState.isProcessing) {
        audioService.current.cancelRecording();
        
        // Clean up any temporary files
        if (audioService.current.getLastRecordingPath && audioService.current.getLastRecordingPath()) {
          audioService.current.cleanupTemporaryFiles && audioService.current.cleanupTemporaryFiles();
        }
      }
    };
  }, [stopVisualizationTimer, recordingState.isRecording, recordingState.isProcessing]);
  
  // Start recording with improved error handling
  const startRecording = useCallback(async (customOptions?: AudioRecordingOptions) => {
    try {
      // Reset state
      setRecordingState({
        isRecording: false,
        durationSeconds: 0,
        audioLevel: 0,
        isProcessing: false,
        isSilent: false,
        error: null,
      });
      
      // Merge default options with custom options and props options
      const mergedOptions = {
        ...options,
        ...customOptions,
      };
      
      // Start recording with retry mechanism handled in the adapter
      await audioService.current.startRecording(mergedOptions);
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Start visualization timer
      startVisualizationTimer();
      
      // Update state from the service
      const updatedState = audioService.current.getRecordingState();
      setRecordingState(updatedState);
    } catch (err) {
      console.error('Failed to start recording', err);
      
      // Handle error with more detailed information
      const errorMessage = err instanceof Error ? 
        err.message : 
        'Failed to start recording';
        
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: new Error(`Recording failed: ${errorMessage}`),
      }));
      
      // Ensure visualization timer is stopped
      stopVisualizationTimer();
      
      // Re-throw the error for the component to handle
      throw err;
    }
  }, [options, startVisualizationTimer, stopVisualizationTimer]);
  
  // Stop recording with improved error handling
  const stopRecording = useCallback(async () => {
    try {
      // Stop visualization timer
      stopVisualizationTimer();
      
      // Set processing state
      setRecordingState(prev => ({
        ...prev,
        isProcessing: true,
      }));
      
      // Stop recording with retry mechanism handled in the adapter
      const audioBlob = await audioService.current.stopRecording();
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Update state from the service
      const updatedState = audioService.current.getRecordingState();
      setRecordingState(updatedState);
      
      return audioBlob;
    } catch (err) {
      console.error('Failed to stop recording', err);
      
      // Handle error with more detailed information
      const errorMessage = err instanceof Error ? 
        err.message : 
        'Failed to stop recording';
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: new Error(`Recording stop failed: ${errorMessage}`),
      }));
      
      // If we failed to stop recording cleanly, try to cancel it
      try {
        audioService.current.cancelRecording();
      } catch (cancelErr) {
        console.warn('Failed to cancel recording after stop failure', cancelErr);
      }
      
      throw err;
    }
  }, [stopVisualizationTimer]);
  
  // Pause recording
  const pauseRecording = useCallback(async () => {
    try {
      await audioService.current.pauseRecording();
      
      // Update state from the service
      const updatedState = audioService.current.getRecordingState();
      setRecordingState(updatedState);
    } catch (err) {
      console.error('Failed to pause recording', err);
      setRecordingState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to pause recording'),
      }));
      throw err;
    }
  }, []);
  
  // Resume recording
  const resumeRecording = useCallback(async () => {
    try {
      await audioService.current.resumeRecording();
      
      // Update state from the service
      const updatedState = audioService.current.getRecordingState();
      setRecordingState(updatedState);
    } catch (err) {
      console.error('Failed to resume recording', err);
      setRecordingState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to resume recording'),
      }));
      throw err;
    }
  }, []);
  
  // Cancel recording with improved cleanup
  const cancelRecording = useCallback(() => {
    // Stop visualization timer
    stopVisualizationTimer();
    
    // Cancel recording
    audioService.current.cancelRecording();
    
    // Update state
    setRecordingState({
      isRecording: false,
      durationSeconds: 0,
      audioLevel: 0,
      isProcessing: false,
      isSilent: false,
      error: null,
    });
    
    // Clean up temporary files in background
    setTimeout(() => {
      if (audioService.current.cleanupTemporaryFiles) {
        audioService.current.cleanupTemporaryFiles().catch(err => {
          console.warn('Failed to clean up temporary files', err);
        });
      }
    }, 500);
  }, [stopVisualizationTimer]);
  
  // Update state periodically from the service
  useEffect(() => {
    if (recordingState.isRecording) {
      const updateTimer = setInterval(() => {
        const updatedState = audioService.current.getRecordingState();
        setRecordingState(updatedState);
      }, 500); // Update every 500ms
      
      return () => clearInterval(updateTimer);
    }
  }, [recordingState.isRecording]);
  
  return {
    isRecording: recordingState.isRecording,
    isProcessing: recordingState.isProcessing,
    duration: recordingState.durationSeconds,
    audioLevel: recordingState.audioLevel,
    error: recordingState.error,
    visualizationData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  };
};
