import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioRecordingOptions {
  maxDuration?: number; // Maximum recording duration in seconds
  mimeType?: string; // MIME type for recording
  visualize?: boolean; // Whether to enable visualization
  sampleRate?: number; // Sample rate for recording
  qualityCheckInterval?: number; // Interval for audio quality checks in ms
  compressAudio?: boolean; // Whether to compress audio before saving
  audioBitsPerSecond?: number; // Bits per second for audio recording
}

export interface AudioQualityInfo {
  isGood: boolean;
  noiseLevel: number; // 0-100
  volumeLevel: number; // 0-100
  issues: Array<'low-volume' | 'high-noise' | 'clipping' | 'interrupted'>;
}

interface AudioRecordingState {
  status: 'inactive' | 'recording' | 'paused' | 'completed';
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  visualizationData: number[] | null;
  error: Error | null;
  qualityInfo: AudioQualityInfo | null;
  recordingFormat: string | null;
}

interface AudioRecordingControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  getVisualizationData: () => number[] | null;
  exportWaveform: () => Uint8Array | null;
}

/**
 * Enhanced hook for handling audio recording with quality detection and optimization
 */
export function useAudioRecording(options?: AudioRecordingOptions): [AudioRecordingState, AudioRecordingControls] {
  const {
    maxDuration = 180, // Default 3 minutes
    mimeType = 'audio/webm',
    visualize = true,
    sampleRate = 44100,
    qualityCheckInterval = 1000, // Check quality every second
    compressAudio = true,
    audioBitsPerSecond = 128000 // 128 kbps - good balance of quality vs size
  } = options || {};
  
  // State
  const [state, setState] = useState<AudioRecordingState>({
    status: 'inactive',
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    visualizationData: null,
    error: null,
    qualityInfo: null,
    recordingFormat: null
  });
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const qualityCheckRef = useRef<number | null>(null);
  const noiseFloorRef = useRef<number[]>([]);
  const volumeHistoryRef = useRef<number[]>([]);
  const interruptionsRef = useRef<number>(0);
  const silenceDurationRef = useRef<number>(0);
  
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
    
    if (qualityCheckRef.current) {
      clearInterval(qualityCheckRef.current);
      qualityCheckRef.current = null;
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
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    gainNodeRef.current = null;
    audioChunksRef.current = [];
    noiseFloorRef.current = [];
    volumeHistoryRef.current = [];
    silenceDurationRef.current = 0;
    interruptionsRef.current = 0;
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Check if MediaRecorder is available with specified mime type
  const isTypeSupported = useCallback(() => {
    return MediaRecorder.isTypeSupported(mimeType);
  }, [mimeType]);
  
  // Get supported mime type fallback if needed
  const getSupportedMimeType = useCallback(() => {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'audio/webm'; // Default fallback, might not work
  }, []);
  
  // Audio visualization
  const updateVisualization = useCallback(() => {
    if (!analyserRef.current || !visualize) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Use a subset of the frequency data for visualization
    const visualizationData = Array.from(dataArray)
      .filter((_, i) => i % 4 === 0) // Take every 4th value
      .slice(0, 32); // Use only the first 32 values for more manageable display
    
    setState(prevState => ({
      ...prevState,
      visualizationData
    }));
    
    animationFrameRef.current = requestAnimationFrame(updateVisualization);
  }, [visualize]);
  
  // Check audio quality
  const checkAudioQuality = useCallback(() => {
    if (!analyserRef.current) return;
    
    const volumeData = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(volumeData);
    
    // Calculate average volume level
    const averageVolume = Array.from(volumeData).reduce((sum, val) => sum + val, 0) / volumeData.length;
    const volumeLevel = Math.min(100, Math.round((averageVolume / 255) * 100));
    
    // Store in history for trend analysis
    volumeHistoryRef.current.push(volumeLevel);
    if (volumeHistoryRef.current.length > 5) {
      volumeHistoryRef.current.shift();
    }
    
    // Calculate noise level (low frequency content when not speaking)
    const lowFreqData = Array.from(volumeData).slice(0, Math.floor(volumeData.length / 8));
    const lowFreqAvg = lowFreqData.reduce((sum, val) => sum + val, 0) / lowFreqData.length;
    const noiseLevel = Math.min(100, Math.round((lowFreqAvg / 255) * 100));
    
    // Store for noise floor detection
    if (noiseLevel > 5) {
      noiseFloorRef.current.push(noiseLevel);
      if (noiseFloorRef.current.length > 10) {
        noiseFloorRef.current.shift();
      }
    }
    
    // Check for silence (potential interruption)
    if (volumeLevel < 10) {
      silenceDurationRef.current += qualityCheckInterval / 1000;
      
      // Count as interruption if silence lasts more than 2 seconds
      if (silenceDurationRef.current >= 2) {
        interruptionsRef.current += 1;
        silenceDurationRef.current = 0;
      }
    } else {
      silenceDurationRef.current = 0;
    }
    
    // Calculate average noise floor
    const avgNoiseFloor = noiseFloorRef.current.length > 0
      ? noiseFloorRef.current.reduce((sum, val) => sum + val, 0) / noiseFloorRef.current.length
      : 0;
    
    // Determine audio quality issues
    const issues: Array<'low-volume' | 'high-noise' | 'clipping' | 'interrupted'> = [];
    
    // Check for low volume
    const recentVolumeAvg = volumeHistoryRef.current.reduce((sum, val) => sum + val, 0) / 
      Math.max(1, volumeHistoryRef.current.length);
    
    if (recentVolumeAvg < 20) {
      issues.push('low-volume');
    }
    
    // Check for high background noise
    if (avgNoiseFloor > 30) {
      issues.push('high-noise');
    }
    
    // Check for audio clipping (volume consistently too high)
    if (volumeHistoryRef.current.filter(v => v > 95).length >= 3) {
      issues.push('clipping');
    }
    
    // Check for interruptions
    if (interruptionsRef.current > 2) {
      issues.push('interrupted');
    }
    
    // Update quality info
    const qualityInfo: AudioQualityInfo = {
      isGood: issues.length === 0,
      noiseLevel: Math.round(avgNoiseFloor),
      volumeLevel: Math.round(recentVolumeAvg),
      issues
    };
    
    setState(prevState => ({
      ...prevState,
      qualityInfo
    }));
  }, [qualityCheckInterval]);
  
  // Compress audio for more efficient upload
  const compressAudioBlob = useCallback(async (blob: Blob): Promise<Blob> => {
    if (!compressAudio) return blob;
    
    try {
      // Create an off-screen audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 22050, // Lower sample rate for smaller file size
      });
      
      // Convert the blob to an ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create a new buffer with the desired properties
      const numberOfChannels = 1; // Mono for smaller file size
      const newBuffer = audioContext.createBuffer(
        numberOfChannels, 
        audioBuffer.length, 
        audioContext.sampleRate
      );
      
      // Copy and mix down channels if needed
      if (audioBuffer.numberOfChannels > 1) {
        // Mix down to mono
        const channel1 = audioBuffer.getChannelData(0);
        const channel2 = audioBuffer.getChannelData(1);
        const newChannel = newBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
          newChannel[i] = (channel1[i] + channel2[i]) / 2;
        }
      } else {
        // Just copy the single channel
        const channel = audioBuffer.getChannelData(0);
        const newChannel = newBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
          newChannel[i] = channel[i];
        }
      }
      
      // Convert the buffer to a WAV blob
      const wavBlob = await audioBufferToWav(newBuffer);
      
      // Close the audio context
      await audioContext.close();
      
      return wavBlob;
    } catch (err) {
      console.error('Error compressing audio:', err);
      // Fall back to original blob
      return blob;
    }
  }, [compressAudio]);
  
  // Convert AudioBuffer to WAV format
  const audioBufferToWav = useCallback((buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2; // 16-bit audio (2 bytes per sample)
    const sampleRate = buffer.sampleRate;
    
    // Create the WAV header
    const headerLength = 44;
    const dataLength = length;
    const fileLength = headerLength + dataLength;
    
    const arrayBuffer = new ArrayBuffer(fileLength);
    const view = new DataView(arrayBuffer);
    
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileLength - 8, true);
    writeString(view, 8, 'WAVE');
    
    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // 16 for PCM format
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true); // Byte rate
    view.setUint16(32, numberOfChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    
    // Data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write the PCM samples
    const offset = 44;
    let index = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        // Convert float to 16-bit signed integer
        const value = Math.max(-1, Math.min(1, sample)) * 32767;
        view.setInt16(offset + index, value, true);
        index += 2;
      }
    }
    
    return new Blob([view], { type: 'audio/wav' });
  }, []);
  
  // Helper to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // Initialize audio processing and recording
  const initializeAudio = useCallback(async () => {
    try {
      // Request audio stream with specified constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: sampleRate,
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: sampleRate
      });
      audioContextRef.current = audioContext;
      
      // Create nodes for processing
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      
      // Add gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(analyser);
      
      // Store references
      analyserRef.current = analyser;
      
      // Check what mime types are supported
      let recorderOptions = {};
      let actualMimeType = mimeType;
      
      if (!isTypeSupported()) {
        actualMimeType = getSupportedMimeType();
        console.warn(`Specified mime type ${mimeType} not supported, falling back to ${actualMimeType}`);
      }
      
      // Configure MediaRecorder options
      if (audioBitsPerSecond) {
        recorderOptions = {
          mimeType: actualMimeType,
          audioBitsPerSecond: audioBitsPerSecond
        };
      } else {
        recorderOptions = {
          mimeType: actualMimeType
        };
      }
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      
      setState(prevState => ({
        ...prevState,
        recordingFormat: actualMimeType
      }));
      
      return { mediaRecorder, analyser };
    } catch (err) {
      console.error('Error initializing audio:', err);
      throw err;
    }
  }, [getSupportedMimeType, isTypeSupported, mimeType, sampleRate, audioBitsPerSecond]);
  
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
        error: null,
        qualityInfo: null,
        recordingFormat: null
      });
      
      noiseFloorRef.current = [];
      volumeHistoryRef.current = [];
      interruptionsRef.current = 0;
      
      // Initialize audio system
      const { mediaRecorder } = await initializeAudio();
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          // Create blob from chunks
          const rawBlob = new Blob(audioChunksRef.current, { type: state.recordingFormat || undefined });
          
          // Compress if enabled
          let finalBlob: Blob;
          if (compressAudio) {
            finalBlob = await compressAudioBlob(rawBlob);
          } else {
            finalBlob = rawBlob;
          }
          
          const audioUrl = URL.createObjectURL(finalBlob);
          
          setState(prevState => ({
            ...prevState,
            status: 'completed',
            audioBlob: finalBlob,
            audioUrl,
            duration: durationRef.current
          }));
        } catch (err) {
          setState(prevState => ({
            ...prevState,
            error: err instanceof Error ? err : new Error(String(err))
          }));
        } finally {
          // Clean up resources
          cleanup();
        }
      };
      
      // Start recording
      audioChunksRef.current = [];
      mediaRecorder.start(100); // Collect data every 100ms for smoother visualization
      
      // Start visualization
      if (visualize) {
        updateVisualization();
      }
      
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
      
      // Start quality monitoring
      qualityCheckRef.current = window.setInterval(() => {
        checkAudioQuality();
      }, qualityCheckInterval);
      
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
  }, [
    cleanup, 
    maxDuration, 
    updateVisualization, 
    visualize, 
    initializeAudio, 
    checkAudioQuality, 
    qualityCheckInterval,
    compressAudioBlob,
    state.recordingFormat
  ]);
  
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
      
      if (qualityCheckRef.current) {
        clearInterval(qualityCheckRef.current);
        qualityCheckRef.current = null;
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
      
      // Resume quality monitoring
      qualityCheckRef.current = window.setInterval(() => {
        checkAudioQuality();
      }, qualityCheckInterval);
      
      setState(prevState => ({
        ...prevState,
        status: 'recording'
      }));
    }
  }, [maxDuration, stopRecording, checkAudioQuality, qualityCheckInterval]);
  
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
      error: null,
      qualityInfo: null,
      recordingFormat: null
    });
  }, [cleanup, state.audioUrl]);
  
  // Get visualization data
  const getVisualizationData = useCallback(() => {
    return state.visualizationData;
  }, [state.visualizationData]);
  
  // Export waveform data for external visualization
  const exportWaveform = useCallback(() => {
    if (!analyserRef.current) return null;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);
  
  return [
    state,
    {
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      clearRecording,
      getVisualizationData,
      exportWaveform
    }
  ];
}

export default useAudioRecording;
