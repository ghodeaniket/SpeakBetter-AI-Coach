/**
 * SpeechTranscriber component
 * Transcribes speech from audio recordings
 */

import React, { useState, useCallback } from 'react';
import { useSpeechService } from '../../hooks/speech';
import { webServiceFactory } from '../../adapters/WebServiceFactory';
import { TranscriptionResult, WordTiming } from '@speakbetter/core/services';

/**
 * Component props
 */
export interface SpeechTranscriberProps {
  /**
   * Callback when transcription is complete
   */
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  
  /**
   * Callback for transcription progress
   */
  onProgress?: (progress: number) => void;
  
  /**
   * Callback for errors
   */
  onError?: (error: Error) => void;
  
  /**
   * Language code for transcription
   */
  languageCode?: string;
  
  /**
   * Whether to filter profanity
   */
  profanityFilter?: boolean;
  
  /**
   * Whether to use enhanced model
   */
  enhancedModel?: boolean;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * SpeechTranscriber component
 */
export const SpeechTranscriber: React.FC<SpeechTranscriberProps> = ({
  onTranscriptionComplete,
  onProgress,
  onError,
  languageCode = 'en-US',
  profanityFilter = false,
  enhancedModel = true,
  className = ''
}) => {
  // Get speech service
  const { transcribe, isRecognitionSupported, isTranscribing } = useSpeechService();
  
  // Get audio service for recording
  const audioService = webServiceFactory.getAudioService();
  
  // Component state
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcription, setTranscription] = useState<string>('');
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);
      setRecordingDuration(0);
      setTranscription('');
      setWordTimings([]);
      
      // Request permission
      const permissionGranted = await audioService.requestPermission();
      if (!permissionGranted) {
        throw new Error('Microphone permission denied');
      }
      
      // Start recording
      await audioService.startRecording({
        format: 'audio/webm',
        channels: 1,
        sampleRate: 16000, // 16kHz is good for speech recognition
        maxDuration: 300, // 5 minutes max
        autoStop: true,
        reduceNoise: true,
        onDataAvailable: (data) => {
          // We don't need to do anything with partial data
          // but we could use this to show real-time visualization
        }
      });
      
      // Start timer to update recording duration
      const timer = setInterval(() => {
        const state = audioService.getRecordingState();
        setRecordingDuration(state.durationSeconds);
      }, 100);
      
      // Clean up timer when recording stops
      return () => {
        clearInterval(timer);
      };
    } catch (err) {
      console.error('Error starting recording:', err);
      setIsRecording(false);
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : String(err)));
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [audioService, onError]);
  
  /**
   * Stop recording and start transcription
   */
  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      
      // Stop recording and get the audio blob
      const blob = await audioService.stopRecording();
      setAudioFile(blob);
      
      // Transcribe the audio
      const result = await transcribe({
        audioFile: blob,
        languageCode,
        profanityFilter,
        enhancedModel,
        onProgress
      });
      
      // Update state with transcription results
      setTranscription(result.text);
      setWordTimings(result.wordTimings);
      
      // Notify parent component
      onTranscriptionComplete?.(result);
    } catch (err) {
      console.error('Error stopping recording or transcribing:', err);
      setError('Transcription failed: ' + (err instanceof Error ? err.message : String(err)));
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [
    audioService, 
    transcribe, 
    languageCode, 
    profanityFilter,
    enhancedModel,
    onProgress,
    onTranscriptionComplete,
    onError
  ]);
  
  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(() => {
    audioService.cancelRecording();
    setIsRecording(false);
    setRecordingDuration(0);
  }, [audioService]);
  
  /**
   * Handle file upload for transcription
   */
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setError(null);
        
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        setAudioFile(file);
        
        // Transcribe the uploaded file
        const result = await transcribe({
          audioFile: file,
          languageCode,
          profanityFilter,
          enhancedModel,
          onProgress
        });
        
        // Update state with transcription results
        setTranscription(result.text);
        setWordTimings(result.wordTimings);
        
        // Notify parent component
        onTranscriptionComplete?.(result);
      } catch (err) {
        console.error('Error transcribing uploaded file:', err);
        setError('Transcription failed: ' + (err instanceof Error ? err.message : String(err)));
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [
      transcribe, 
      languageCode, 
      profanityFilter,
      enhancedModel,
      onProgress,
      onTranscriptionComplete,
      onError
    ]
  );
  
  /**
   * Format duration as MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`speech-transcriber ${className}`}>
      {/* Recording and transcription controls */}
      <div className="speech-transcriber__controls">
        {isRecognitionSupported ? (
          <>
            {isRecording ? (
              <div className="speech-transcriber__recording">
                <button
                  className="speech-transcriber__button speech-transcriber__button--stop"
                  onClick={stopRecording}
                  disabled={isTranscribing}
                >
                  Stop Recording
                </button>
                <button
                  className="speech-transcriber__button speech-transcriber__button--cancel"
                  onClick={cancelRecording}
                  disabled={isTranscribing}
                >
                  Cancel
                </button>
                <div className="speech-transcriber__duration">
                  {formatDuration(recordingDuration)}
                </div>
              </div>
            ) : (
              <div className="speech-transcriber__not-recording">
                <button
                  className="speech-transcriber__button speech-transcriber__button--start"
                  onClick={startRecording}
                  disabled={isTranscribing}
                >
                  Start Recording
                </button>
                <div className="speech-transcriber__or">or</div>
                <div className="speech-transcriber__upload">
                  <label
                    htmlFor="audio-upload"
                    className="speech-transcriber__upload-label"
                  >
                    Upload Audio
                  </label>
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isTranscribing}
                    className="speech-transcriber__upload-input"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="speech-transcriber__not-supported">
            Speech recognition is not supported in your browser.
            Please upload an audio file instead.
            <div className="speech-transcriber__upload">
              <label
                htmlFor="audio-upload"
                className="speech-transcriber__upload-label"
              >
                Upload Audio
              </label>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isTranscribing}
                className="speech-transcriber__upload-input"
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Status */}
      <div className="speech-transcriber__status">
        {isTranscribing && (
          <div className="speech-transcriber__transcribing">
            Transcribing audio...
          </div>
        )}
        
        {error && (
          <div className="speech-transcriber__error">
            {error}
          </div>
        )}
      </div>
      
      {/* Transcription results */}
      {transcription && (
        <div className="speech-transcriber__results">
          <h3 className="speech-transcriber__results-title">Transcription</h3>
          <p className="speech-transcriber__transcription">
            {transcription}
          </p>
          
          {wordTimings.length > 0 && (
            <div className="speech-transcriber__word-timings">
              <h4 className="speech-transcriber__word-timings-title">Word Timings</h4>
              <div className="speech-transcriber__word-timings-list">
                {wordTimings.map((timing, index) => (
                  <span
                    key={`${timing.word}-${index}`}
                    className="speech-transcriber__word"
                    title={`${timing.startTime.toFixed(2)}s - ${timing.endTime.toFixed(2)}s`}
                  >
                    {timing.word}{' '}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
