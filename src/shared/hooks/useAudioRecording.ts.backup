import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioRecordingOptions {
  maxDuration?: number; // Maximum recording duration in seconds
  mimeType?: string; // MIME type for recording
  visualize?: boolean; // Whether to enable visualization
}

interface AudioRecordingState {
  status: 'inactive' | 'recording' | 'paused' | 'completed';
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  visualizationData: number[] | null;
  error: Error | null;
}

interface AudioRecordingControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  getVisualizationData: () => number[] | null;
}

/**
 * Hook for handling audio recording functionality
 */
export function useAudioRecording(options?: AudioRecordingOptions): [AudioRecordingState, AudioRecordingControls] {
  const {
    maxDuration = 180, // Default 3 minutes
    mimeType = 'audio/webm',
    visualize = true
  } = options || {};
  
  // State
  const [state, setState] = useState<AudioRecordingState>({
    status: 'inactive',
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    visualizationData: null,
    error: null
  });
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  
  // Clean up resources
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    analyserRef.current = null;
    audioChunksRef.current = [];
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Audio visualization
  const updateVisualization = useCallback(() => {
    if (!analyserRef.current || !visualize) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Use a subset of the frequency data for visualization
    const visualizationData = Array.from(dataArray)
      .filter((_, i) => i % 4 === 0) // Take every 4th value to reduce data points
      .slice(0, 32); // Use only the first 32 values
    
    setState(prevState => ({
      ...prevState,
      visualizationData
    }));
    
    animationFrameRef.current = requestAnimationFrame(updateVisualization);
  }, [visualize]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      cleanup();
      
      // Reset state
      setState({
        status: 'inactive',
        audioBlob: null,
        audioUrl: null,
        duration: 0,
        visualizationData: null,
        error: null
      });
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context for visualization if needed
      if (visualize) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        
        // Start visualization
        updateVisualization();
      }
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prevState => ({
          ...prevState,
          status: 'completed',
          audioBlob,
          audioUrl,
          duration: durationRef.current
        }));
        
        // Clean up resources
        cleanup();
      };
      
      // Start recording
      audioChunksRef.current = [];
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start timer
      startTimeRef.current = Date.now();
      durationRef.current = 0;
      
      timerRef.current = window.setInterval(() => {
        durationRef.current = (Date.now() - startTimeRef.current) / 1000;
        
        setState(prevState => ({
          ...prevState,
          duration: durationRef.current
        }));
        
        // Stop if max duration reached
        if (durationRef.current >= maxDuration) {
          stopRecording();
        }
      }, 100);
      
      setState(prevState => ({
        ...prevState,
        status: 'recording'
      }));
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prevState => ({
        ...prevState,
        error: error instanceof Error ? error : new Error(String(error)),
        status: 'inactive'
      }));
      cleanup();
    }
  }, [cleanup, maxDuration, mimeType, updateVisualization, visualize]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);
  
  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setState(prevState => ({
        ...prevState,
        status: 'paused'
      }));
    }
  }, []);
  
  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      
      // Resume timer
      const pausedDuration = durationRef.current;
      startTimeRef.current = Date.now() - (pausedDuration * 1000);
      
      timerRef.current = window.setInterval(() => {
        durationRef.current = (Date.now() - startTimeRef.current) / 1000;
        
        setState(prevState => ({
          ...prevState,
          duration: durationRef.current
        }));
        
        // Stop if max duration reached
        if (durationRef.current >= maxDuration) {
          stopRecording();
        }
      }, 100);
      
      setState(prevState => ({
        ...prevState,
        status: 'recording'
      }));
    }
  }, [maxDuration, stopRecording]);
  
  // Clear recording
  const clearRecording = useCallback(() => {
    cleanup();
    
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState({
      status: 'inactive',
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      visualizationData: null,
      error: null
    });
  }, [cleanup, state.audioUrl]);
  
  // Get visualization data
  const getVisualizationData = useCallback(() => {
    return state.visualizationData;
  }, [state.visualizationData]);
  
  return [
    state,
    {
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      clearRecording,
      getVisualizationData
    }
  ];
}

export default useAudioRecording;
