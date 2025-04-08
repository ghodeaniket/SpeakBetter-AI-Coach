import { useState, useCallback, useRef, useEffect } from 'react';
import { TranscriptionResult } from '../../../services/google-cloud/speech';
import { processAudio } from '../services/speechToTextService';

interface SpeechAnalysisOptions {
  languageCode?: string;
  storeInStorage?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
  cacheResults?: boolean;
  cacheDuration?: number; // in milliseconds
}

interface SpeechAnalysisState {
  isAnalyzing: boolean;
  progress: number; // 0-100
  transcriptionResult: TranscriptionResult | null;
  processingTimeMs: number | null;
  wordsPerMinute: number | null;
  clarityScore: number | null;
  audioUrl: string | null;
  error: Error | null;
}

type SpeechAnalysisCache = {
  [key: string]: {
    result: Omit<SpeechAnalysisState, 'isAnalyzing' | 'progress' | 'error'>;
    timestamp: number;
  };
};

/**
 * Hook for speech analysis functionality
 */
export function useSpeechAnalysis(options?: SpeechAnalysisOptions) {
  const {
    languageCode = 'en-US',
    storeInStorage = true,
    retryOnFailure = true,
    maxRetries = 2,
    cacheResults = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
  } = options || {};

  const [state, setState] = useState<SpeechAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    transcriptionResult: null,
    processingTimeMs: null,
    wordsPerMinute: null,
    clarityScore: null,
    audioUrl: null,
    error: null,
  });

  // Cache for storing analysis results
  const cacheRef = useRef<SpeechAnalysisCache>({});
  
  // Current retry count
  const retryCountRef = useRef(0);
  
  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up function to reset state
  const resetState = useCallback(() => {
    setState({
      isAnalyzing: false,
      progress: 0,
      transcriptionResult: null,
      processingTimeMs: null,
      wordsPerMinute: null,
      clarityScore: null,
      audioUrl: null,
      error: null,
    });
    retryCountRef.current = 0;
    
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Generate cache key for blob
  const generateCacheKey = useCallback((blob: Blob): string => {
    // Use size and type as part of the key
    return `audio_${blob.size}_${blob.type}_${languageCode}`;
  }, [languageCode]);

  // Check if cache entry is still valid
  const isCacheValid = useCallback((cacheEntry: { timestamp: number }): boolean => {
    if (!cacheResults || !cacheDuration) return false;
    return Date.now() - cacheEntry.timestamp < cacheDuration;
  }, [cacheResults, cacheDuration]);

  // Set progress with debouncing to avoid too many state updates
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(99, progress) // Never reach 100% until completion
    }));
  }, []);

  // Process audio for analysis with retry logic
  const analyzeAudio = useCallback(async (audioBlob: Blob): Promise<void> => {
    try {
      resetState();
      
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        progress: 0,
        error: null
      }));
      
      // Check cache first if enabled
      if (cacheResults) {
        const cacheKey = generateCacheKey(audioBlob);
        const cachedResult = cacheRef.current[cacheKey];
        
        if (cachedResult && isCacheValid(cachedResult)) {
          // Use cached result
          setState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 100,
            ...cachedResult.result
          }));
          return;
        }
      }
      
      // Set up the abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Start progress simulation
      let progressInterval = setInterval(() => {
        setState(prev => {
          // Progress simulation algorithm:
          // - Fast at first (0-50%)
          // - Slower in the middle (50-80%)
          // - Very slow near the end (80-99%)
          const increment = prev.progress < 50 ? 5 : 
                           prev.progress < 80 ? 2 : 0.5;
          return {
            ...prev,
            progress: Math.min(99, prev.progress + increment)
          };
        });
      }, 300);
      
      // Process audio with the service
      const result = await processAudio(audioBlob, {
        uploadToStorage: storeInStorage,
        languageCode
      });
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      // Store in cache if enabled
      if (cacheResults) {
        const cacheKey = generateCacheKey(audioBlob);
        cacheRef.current[cacheKey] = {
          result: {
            transcriptionResult: result.transcriptionResult,
            processingTimeMs: result.processingTimeMs,
            wordsPerMinute: result.wordsPerMinute || null,
            clarityScore: result.clarityScore,
            audioUrl: result.audioUrl || null
          },
          timestamp: Date.now()
        };
      }
      
      // Update state with results
      setState({
        isAnalyzing: false,
        progress: 100,
        transcriptionResult: result.transcriptionResult,
        processingTimeMs: result.processingTimeMs,
        wordsPerMinute: result.wordsPerMinute || null,
        clarityScore: result.clarityScore,
        audioUrl: result.audioUrl || null,
        error: null
      });
      
    } catch (err) {
      console.error('Error analyzing audio:', err);
      
      // Clear progress interval if it exists
      clearInterval(progressInterval);
      
      // Handle retry logic
      if (retryOnFailure && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.log(`Retrying analysis (attempt ${retryCountRef.current} of ${maxRetries})...`);
        
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return analyzeAudio(audioBlob);
      }
      
      // Set error state if all retries failed or retry is disabled
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 0,
        error: err instanceof Error ? err : new Error(String(err))
      }));
    }
  }, [
    resetState, 
    cacheResults, 
    generateCacheKey, 
    isCacheValid, 
    storeInStorage, 
    languageCode,
    retryOnFailure,
    maxRetries
  ]);

  // Cancel ongoing analysis
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      progress: 0
    }));
  }, []);

  // Clear all cached results
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    state,
    analyzeAudio,
    cancelAnalysis,
    resetState,
    clearCache
  };
}

export default useSpeechAnalysis;
