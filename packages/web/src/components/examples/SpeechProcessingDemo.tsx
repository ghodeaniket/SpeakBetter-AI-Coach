/**
 * SpeechProcessingDemo component
 * Demonstrates the speech processing capabilities
 */

import React, { useState, useRef } from 'react';
import { AudioVisualizer } from '../audio/AudioVisualizer';
import { SpeechTranscriber } from '../speech/SpeechTranscriber';
import { TextToSpeech } from '../speech/TextToSpeech';
import { TranscriptionResult, VisualizationType } from '@speakbetter/core/services';
import { webServiceFactory } from '../../adapters/WebServiceFactory';

/**
 * Component props
 */
export interface SpeechProcessingDemoProps {
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * SpeechProcessingDemo component
 */
export const SpeechProcessingDemo: React.FC<SpeechProcessingDemoProps> = ({
  className = ''
}) => {
  // Get audio service
  const audioService = webServiceFactory.getAudioService();
  
  // State for demo
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<'transcribe' | 'synthesize'>('transcribe');
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(VisualizationType.WAVEFORM);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128).fill(0));
  
  // Animation ref for getting latest audio data
  const animationRef = useRef<number | null>(null);
  
  /**
   * Get current audio data for visualization
   */
  const getAudioData = () => {
    if (audioService.isRecordingSupported() && audioService.getRecordingState().isRecording) {
      // Get visualization data from recording
      const visualizationData = audioService.getVisualizationData();
      
      // Use frequency data for frequency visualization, time data for waveform
      if (visualizationType === VisualizationType.FREQUENCY) {
        setAudioData(visualizationData.frequencyData);
        return visualizationData.frequencyData;
      } else {
        setAudioData(visualizationData.timeData);
        return visualizationData.timeData;
      }
    }
    
    // Return current audio data if not recording
    return audioData;
  };
  
  /**
   * Handle transcription complete
   */
  const handleTranscriptionComplete = (result: TranscriptionResult) => {
    setTranscriptionResult(result);
  };
  
  /**
   * Handle audio generated from text-to-speech
   */
  const handleAudioGenerated = (blob: Blob) => {
    setAudioBlob(blob);
  };
  
  /**
   * Handle visualization type change
   */
  const handleVisualizationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVisualizationType(e.target.value as VisualizationType);
  };
  
  return (
    <div className={`speech-processing-demo ${className}`}>
      <h2 className="speech-processing-demo__title">Speech Processing Demo</h2>
      
      {/* Tab navigation */}
      <div className="speech-processing-demo__tabs">
        <button
          className={`speech-processing-demo__tab ${activeTab === 'transcribe' ? 'speech-processing-demo__tab--active' : ''}`}
          onClick={() => setActiveTab('transcribe')}
        >
          Speech to Text
        </button>
        <button
          className={`speech-processing-demo__tab ${activeTab === 'synthesize' ? 'speech-processing-demo__tab--active' : ''}`}
          onClick={() => setActiveTab('synthesize')}
        >
          Text to Speech
        </button>
      </div>
      
      {/* Audio visualization */}
      <div className="speech-processing-demo__visualization">
        <div className="speech-processing-demo__visualization-controls">
          <label htmlFor="visualization-type">Visualization Type:</label>
          <select
            id="visualization-type"
            value={visualizationType}
            onChange={handleVisualizationTypeChange}
          >
            <option value={VisualizationType.WAVEFORM}>Waveform</option>
            <option value={VisualizationType.FREQUENCY}>Frequency</option>
            <option value={VisualizationType.VOLUME}>Volume</option>
          </select>
        </div>
        
        <AudioVisualizer
          audioData={audioData}
          type={visualizationType}
          width={800}
          height={200}
          foregroundColor="#4A55A2"
          backgroundColor="#f5f7fa"
          animate={true}
          getAudioData={getAudioData}
          className="speech-processing-demo__visualizer"
        />
      </div>
      
      {/* Tab content */}
      <div className="speech-processing-demo__content">
        {activeTab === 'transcribe' ? (
          <div className="speech-processing-demo__transcribe">
            <h3>Speech to Text</h3>
            <p>Record speech or upload an audio file to transcribe it to text.</p>
            
            <SpeechTranscriber
              onTranscriptionComplete={handleTranscriptionComplete}
              onError={(error) => console.error('Transcription error:', error)}
              languageCode="en-US"
              enhancedModel={true}
              className="speech-processing-demo__transcriber"
            />
            
            {transcriptionResult && (
              <div className="speech-processing-demo__result">
                <h4>Analysis</h4>
                <div className="speech-processing-demo__metrics">
                  <div className="speech-processing-demo__metric">
                    <span className="speech-processing-demo__metric-label">Duration:</span>
                    <span className="speech-processing-demo__metric-value">
                      {transcriptionResult.durationSeconds.toFixed(2)}s
                    </span>
                  </div>
                  <div className="speech-processing-demo__metric">
                    <span className="speech-processing-demo__metric-label">Word Count:</span>
                    <span className="speech-processing-demo__metric-value">
                      {transcriptionResult.wordTimings.length}
                    </span>
                  </div>
                  <div className="speech-processing-demo__metric">
                    <span className="speech-processing-demo__metric-label">Words per Minute:</span>
                    <span className="speech-processing-demo__metric-value">
                      {(transcriptionResult.wordTimings.length / (transcriptionResult.durationSeconds / 60)).toFixed(1)}
                    </span>
                  </div>
                  <div className="speech-processing-demo__metric">
                    <span className="speech-processing-demo__metric-label">Confidence:</span>
                    <span className="speech-processing-demo__metric-value">
                      {(transcriptionResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="speech-processing-demo__synthesize">
            <h3>Text to Speech</h3>
            <p>Enter text to convert it to speech.</p>
            
            <TextToSpeech
              initialText={transcriptionResult?.text || ""}
              initialLanguageCode="en-US"
              onAudioGenerated={handleAudioGenerated}
              onError={(error) => console.error('Synthesis error:', error)}
              autoPlay={false}
              className="speech-processing-demo__text-to-speech"
            />
          </div>
        )}
      </div>
    </div>
  );
};
