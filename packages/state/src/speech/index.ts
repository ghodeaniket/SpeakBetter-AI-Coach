import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SpeechAnalysis, SpeechMetrics } from '@speakbetter/core';

interface SpeechState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcription: string | null;
  analysis: SpeechAnalysis | null;
  metrics: SpeechMetrics | null;
  isProcessing: boolean;
  error: Error | null;
  
  setRecording: (isRecording: boolean) => void;
  setAudioBlob: (audioBlob: Blob | null) => void;
  setAudioUrl: (audioUrl: string | null) => void;
  setTranscription: (transcription: string | null) => void;
  setAnalysis: (analysis: SpeechAnalysis | null) => void;
  setMetrics: (metrics: SpeechMetrics | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

export const useSpeechStore = create<SpeechState>()(
  immer((set) => ({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    transcription: null,
    analysis: null,
    metrics: null,
    isProcessing: false,
    error: null,
    
    setRecording: (isRecording) => set((state) => { state.isRecording = isRecording; }),
    setAudioBlob: (audioBlob) => set((state) => { state.audioBlob = audioBlob; }),
    setAudioUrl: (audioUrl) => set((state) => { state.audioUrl = audioUrl; }),
    setTranscription: (transcription) => set((state) => { state.transcription = transcription; }),
    setAnalysis: (analysis) => set((state) => { state.analysis = analysis; }),
    setMetrics: (metrics) => set((state) => { state.metrics = metrics; }),
    setProcessing: (isProcessing) => set((state) => { state.isProcessing = isProcessing; }),
    setError: (error) => set((state) => { state.error = error; }),
    reset: () => set(() => ({
      isRecording: false,
      audioBlob: null,
      audioUrl: null,
      transcription: null,
      analysis: null,
      metrics: null,
      isProcessing: false,
      error: null,
    })),
  }))
);