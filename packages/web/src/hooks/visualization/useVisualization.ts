/**
 * useVisualization hook
 * Provides access to the visualization service in React components
 */

import { useRef, useEffect, useCallback } from 'react';

import {
  VisualizationService,
  VisualizationContext,
  VisualizationOptions,
  VisualizationType
} from '@speakbetter/core/services';

import { webServiceFactory } from '../../adapters/WebServiceFactory';

/**
 * Hook options
 */
export interface UseVisualizationOptions extends Partial<VisualizationOptions> {
  /**
   * Whether to animate the visualization
   */
  animate?: boolean;
  
  /**
   * Animation frames per second
   */
  fps?: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: UseVisualizationOptions = {
  type: VisualizationType.WAVEFORM,
  width: 300,
  height: 100,
  backgroundColor: 'transparent',
  foregroundColor: '#4A55A2',
  animate: true,
  fps: 30
};

/**
 * Hook for using visualization service
 */
export const useVisualization = (containerRef: React.RefObject<HTMLElement>, options?: UseVisualizationOptions) => {
  // Merge with default options
  const visualizationOptions: UseVisualizationOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  
  // Get visualization service
  const visualizationService = webServiceFactory.getVisualizationService();
  
  // Refs
  const contextRef = useRef<VisualizationContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Clean up animation frame
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  // Initialize visualization context
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create context if it doesn't exist
    if (!contextRef.current) {
      contextRef.current = visualizationService.createContext(
        containerRef.current,
        visualizationOptions.width || 300,
        visualizationOptions.height || 100
      );
    }
    
    // Cleanup function
    return () => {
      // Cancel any active animation
      cancelAnimation();
      
      // Release context
      if (contextRef.current) {
        visualizationService.releaseContext(contextRef.current);
        contextRef.current = null;
      }
    };
  }, [
    containerRef, 
    visualizationService, 
    visualizationOptions.width, 
    visualizationOptions.height, 
    cancelAnimation
  ]);
  
  /**
   * Draw audio visualization from data
   */
  const drawAudioVisualization = useCallback((audioData: Uint8Array) => {
    if (!contextRef.current) return;
    
    visualizationService.drawAudioVisualization(
      contextRef.current,
      audioData,
      visualizationOptions as VisualizationOptions
    );
  }, [visualizationService, visualizationOptions]);
  
  /**
   * Start animated visualization with live data source
   */
  const startAnimatedVisualization = useCallback((getDataFn: () => Uint8Array) => {
    if (!contextRef.current) return;
    
    // Cancel any existing animation
    cancelAnimation();
    
    // Don't animate if option is disabled
    if (!visualizationOptions.animate) {
      drawAudioVisualization(getDataFn());
      return;
    }
    
    // Calculate frame interval
    const fps = visualizationOptions.fps || 30;
    const frameInterval = 1000 / fps;
    let lastFrameTime = 0;
    
    // Animation function
    const animate = (timestamp: number) => {
      // Throttle to desired FPS
      if (timestamp - lastFrameTime < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = timestamp;
      
      // Get current data and draw
      const data = getDataFn();
      drawAudioVisualization(data);
      
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Return cancel function
    return cancelAnimation;
  }, [
    visualizationOptions.animate, 
    visualizationOptions.fps,
    drawAudioVisualization,
    cancelAnimation
  ]);
  
  /**
   * Draw word timings visualization
   */
  const drawWordTimings = useCallback((
    wordTimings: Array<{
      word: string;
      startTime: number;
      endTime: number;
    }>,
    currentTime: number,
    totalDuration: number
  ) => {
    if (!contextRef.current) return;
    
    visualizationService.drawWordTimings(
      contextRef.current,
      wordTimings,
      currentTime,
      totalDuration,
      visualizationOptions
    );
  }, [visualizationService, visualizationOptions]);
  
  /**
   * Create a waveform image
   */
  const createWaveformImage = useCallback((audioData: Uint8Array | Float32Array): Promise<string> => {
    return visualizationService.createWaveformImage(
      audioData,
      visualizationOptions as VisualizationOptions
    );
  }, [visualizationService, visualizationOptions]);
  
  return {
    drawAudioVisualization,
    startAnimatedVisualization,
    drawWordTimings,
    createWaveformImage,
    cancelAnimation,
    isSupported: visualizationService.isSupported()
  };
};
