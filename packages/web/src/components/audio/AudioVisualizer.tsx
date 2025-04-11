/**
 * AudioVisualizer component
 * Renders audio data visualization using the visualization service
 */

import React, { useRef, useEffect } from 'react';
import { useVisualization } from '../../hooks/visualization';
import { VisualizationType } from '@speakbetter/core/services';

/**
 * Component props
 */
export interface AudioVisualizerProps {
  /**
   * Audio data to visualize
   */
  audioData: Uint8Array;
  
  /**
   * Visualization type
   */
  type?: VisualizationType;
  
  /**
   * Width of the visualization
   */
  width?: number;
  
  /**
   * Height of the visualization
   */
  height?: number;
  
  /**
   * Background color
   */
  backgroundColor?: string;
  
  /**
   * Foreground color
   */
  foregroundColor?: string;
  
  /**
   * Whether to animate the visualization
   */
  animate?: boolean;
  
  /**
   * Animation frames per second
   */
  fps?: number;
  
  /**
   * Function to get fresh audio data for animation
   */
  getAudioData?: () => Uint8Array;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * AudioVisualizer component
 */
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  type = VisualizationType.WAVEFORM,
  width = 300,
  height = 100,
  backgroundColor = 'transparent',
  foregroundColor = '#4A55A2',
  animate = true,
  fps = 30,
  getAudioData,
  className = ''
}) => {
  // Container ref for the visualization
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get visualization hooks
  const visualization = useVisualization(containerRef, {
    type,
    width,
    height,
    backgroundColor,
    foregroundColor,
    animate,
    fps
  });
  
  // Start animation if animate is true and getAudioData is provided
  useEffect(() => {
    if (animate && getAudioData) {
      // Start animated visualization
      const cancel = visualization.startAnimatedVisualization(getAudioData);
      
      // Clean up
      return () => {
        cancel();
      };
    } else {
      // Draw static visualization
      visualization.drawAudioVisualization(audioData);
    }
  }, [
    animate,
    getAudioData,
    audioData,
    visualization
  ]);
  
  return (
    <div
      ref={containerRef}
      className={`audio-visualizer ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative'
      }}
    >
      {!visualization.isSupported && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666',
            fontSize: '12px',
            textAlign: 'center',
            padding: '8px'
          }}
        >
          Audio visualization is not supported in your browser
        </div>
      )}
    </div>
  );
};
