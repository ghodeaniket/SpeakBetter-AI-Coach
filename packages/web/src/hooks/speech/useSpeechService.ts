/**
 * useSpeechService hook
 * Provides access to the speech service in React components
 */

import { useState, useEffect, useCallback } from 'react';

import {
  SpeechService,
  TranscriptionOptions,
  TranscriptionResult,
  SpeechSynthesisOptions,
  VoiceInfo
} from '@speakbetter/core/services';

import { webServiceFactory } from '../../adapters/WebServiceFactory';

/**
 * Hook for using the speech service
 */
export const useSpeechService = () => {
  // Get speech service instance
  const speechService = webServiceFactory.getSpeechService();
  
  // State for available voices
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  
  // State for support status
  const [isRecognitionSupported, setIsRecognitionSupported] = useState<boolean>(false);
  const [isSynthesisSupported, setIsSynthesisSupported] = useState<boolean>(false);
  
  // State for pending operations
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  
  // Load voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const availableVoices = await speechService.getAvailableVoices();
        setVoices(availableVoices);
      } catch (error) {
        console.error('Error loading voices:', error);
        setVoices([]);
      }
    };
    
    // Check support status
    setIsRecognitionSupported(speechService.isRecognitionSupported());
    setIsSynthesisSupported(speechService.isSynthesisSupported());
    
    // Load voices
    loadVoices();
  }, [speechService]);
  
  /**
   * Transcribe audio to text
   */
  const transcribe = useCallback(async (options: TranscriptionOptions): Promise<TranscriptionResult> => {
    try {
      setIsTranscribing(true);
      return await speechService.transcribe(options);
    } finally {
      setIsTranscribing(false);
    }
  }, [speechService]);
  
  /**
   * Synthesize text to speech
   */
  const synthesize = useCallback(async (options: SpeechSynthesisOptions): Promise<Blob> => {
    try {
      setIsSynthesizing(true);
      return await speechService.synthesize(options);
    } finally {
      setIsSynthesizing(false);
    }
  }, [speechService]);
  
  /**
   * Get voices for a specific language
   */
  const getVoicesForLanguage = useCallback((languageCode: string): VoiceInfo[] => {
    return voices.filter(voice => voice.languageCode.startsWith(languageCode));
  }, [voices]);
  
  /**
   * Get voice by ID
   */
  const getVoiceById = useCallback((id: string): VoiceInfo | undefined => {
    return voices.find(voice => voice.id === id);
  }, [voices]);
  
  /**
   * Cancel ongoing operations
   */
  const cancel = useCallback(() => {
    speechService.cancel();
    setIsTranscribing(false);
    setIsSynthesizing(false);
  }, [speechService]);
  
  return {
    // Core methods
    transcribe,
    synthesize,
    getVoicesForLanguage,
    getVoiceById,
    cancel,
    
    // Voice data
    voices,
    
    // Support status
    isRecognitionSupported,
    isSynthesisSupported,
    
    // Operation status
    isTranscribing,
    isSynthesizing
  };
};
