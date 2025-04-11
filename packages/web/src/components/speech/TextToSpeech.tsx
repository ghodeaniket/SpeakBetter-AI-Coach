/**
 * TextToSpeech component
 * Converts text to speech using the speech service
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSpeechService } from '../../hooks/speech';
import { VoiceInfo } from '@speakbetter/core/services';
import { webServiceFactory } from '../../adapters/WebServiceFactory';

/**
 * Component props
 */
export interface TextToSpeechProps {
  /**
   * Initial text to synthesize
   */
  initialText?: string;
  
  /**
   * Initial language code
   */
  initialLanguageCode?: string;
  
  /**
   * Callback when audio is generated
   */
  onAudioGenerated?: (audioBlob: Blob, audioUrl: string) => void;
  
  /**
   * Callback for errors
   */
  onError?: (error: Error) => void;
  
  /**
   * Placeholder for text input
   */
  placeholder?: string;
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Auto play audio when generated
   */
  autoPlay?: boolean;
}

/**
 * TextToSpeech component
 */
export const TextToSpeech: React.FC<TextToSpeechProps> = ({
  initialText = '',
  initialLanguageCode = 'en-US',
  onAudioGenerated,
  onError,
  placeholder = 'Enter text to convert to speech...',
  className = '',
  autoPlay = false
}) => {
  // Get speech service
  const { 
    synthesize, 
    voices, 
    getVoicesForLanguage, 
    isSynthesisSupported,
    isSynthesizing 
  } = useSpeechService();
  
  // Get audio service for playback
  const audioService = webServiceFactory.getAudioService();
  
  // Component state
  const [text, setText] = useState(initialText);
  const [languageCode, setLanguageCode] = useState(initialLanguageCode);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [languageVoices, setLanguageVoices] = useState<VoiceInfo[]>([]);
  
  /**
   * Initialize available languages and voices
   */
  useEffect(() => {
    if (voices.length > 0) {
      // Get unique language codes
      const languages = Array.from(
        new Set(voices.map(voice => voice.languageCode))
      ).sort();
      
      setAvailableLanguages(languages);
      
      // Set language voices
      const voicesForLanguage = getVoicesForLanguage(languageCode);
      setLanguageVoices(voicesForLanguage);
      
      // Set default voice if not already set
      if (!selectedVoiceId && voicesForLanguage.length > 0) {
        setSelectedVoiceId(voicesForLanguage[0].id);
      }
    }
  }, [voices, languageCode, getVoicesForLanguage, selectedVoiceId]);
  
  /**
   * Update language voices when language changes
   */
  useEffect(() => {
    const voicesForLanguage = getVoicesForLanguage(languageCode);
    setLanguageVoices(voicesForLanguage);
    
    // Select first voice for this language
    if (voicesForLanguage.length > 0) {
      setSelectedVoiceId(voicesForLanguage[0].id);
    }
  }, [languageCode, getVoicesForLanguage]);
  
  /**
   * Clean up when component unmounts
   */
  useEffect(() => {
    return () => {
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Stop any playing audio
      audioService.stopAudio();
    };
  }, [audioUrl, audioService]);
  
  /**
   * Generate speech from text
   */
  const generateSpeech = useCallback(async () => {
    try {
      setError(null);
      
      // Validate text
      if (!text.trim()) {
        setError('Please enter some text to convert to speech');
        return;
      }
      
      // Generate speech
      const blob = await synthesize({
        text,
        voiceId: selectedVoiceId,
        languageCode,
        speakingRate: 1.0,
        pitch: 0 // default pitch
      });
      
      // Create URL for the audio blob
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      const url = URL.createObjectURL(blob);
      
      // Update state
      setAudioBlob(blob);
      setAudioUrl(url);
      
      // Notify parent component
      onAudioGenerated?.(blob, url);
      
      // Auto play if enabled
      if (autoPlay) {
        playAudio(blob);
      }
    } catch (err) {
      console.error('Error generating speech:', err);
      setError('Speech generation failed: ' + (err instanceof Error ? err.message : String(err)));
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [
    text,
    selectedVoiceId,
    languageCode,
    synthesize,
    audioUrl,
    onAudioGenerated,
    autoPlay,
    onError
  ]);
  
  /**
   * Play audio
   */
  const playAudio = useCallback(async (blob?: Blob) => {
    try {
      const audioToPlay = blob || audioBlob;
      if (!audioToPlay) return;
      
      setIsPlaying(true);
      
      await audioService.playAudio(audioToPlay, {
        onEnded: () => {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
      setError('Audio playback failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [audioBlob, audioService]);
  
  /**
   * Pause audio
   */
  const pauseAudio = useCallback(() => {
    audioService.pauseAudio();
    setIsPlaying(false);
  }, [audioService]);
  
  /**
   * Handle text change
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  /**
   * Handle language change
   */
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguageCode(e.target.value);
  };
  
  /**
   * Handle voice change
   */
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoiceId(e.target.value);
  };
  
  return (
    <div className={`text-to-speech ${className}`}>
      {/* Text input */}
      <div className="text-to-speech__input-container">
        <textarea
          className="text-to-speech__text-input"
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={5}
          disabled={isSynthesizing}
        />
      </div>
      
      {/* Voice selection */}
      <div className="text-to-speech__voice-selection">
        <div className="text-to-speech__language-select">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={languageCode}
            onChange={handleLanguageChange}
            disabled={isSynthesizing || availableLanguages.length === 0}
          >
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-to-speech__voice-select">
          <label htmlFor="voice-select">Voice:</label>
          <select
            id="voice-select"
            value={selectedVoiceId}
            onChange={handleVoiceChange}
            disabled={isSynthesizing || languageVoices.length === 0}
          >
            {languageVoices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.gender})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Controls */}
      <div className="text-to-speech__controls">
        <button
          className="text-to-speech__button text-to-speech__button--generate"
          onClick={generateSpeech}
          disabled={!text.trim() || isSynthesizing || !isSynthesisSupported}
        >
          {isSynthesizing ? 'Generating...' : 'Generate Speech'}
        </button>
        
        {audioBlob && (
          <div className="text-to-speech__playback-controls">
            {isPlaying ? (
              <button
                className="text-to-speech__button text-to-speech__button--pause"
                onClick={pauseAudio}
              >
                Pause
              </button>
            ) : (
              <button
                className="text-to-speech__button text-to-speech__button--play"
                onClick={() => playAudio()}
              >
                Play
              </button>
            )}
            
            <a
              href={audioUrl}
              download={`speech-${Date.now()}.mp3`}
              className="text-to-speech__button text-to-speech__button--download"
            >
              Download
            </a>
          </div>
        )}
      </div>
      
      {/* Status and errors */}
      <div className="text-to-speech__status">
        {!isSynthesisSupported && (
          <div className="text-to-speech__not-supported">
            Text-to-speech is not supported in your browser.
          </div>
        )}
        
        {error && (
          <div className="text-to-speech__error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
