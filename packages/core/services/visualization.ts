/**
 * Visualization Service Interface
 * Provides audio and speech visualization functionality
 */

/**
 * Visualization data type
 */
export enum VisualizationType {
  WAVEFORM = 'waveform',
  FREQUENCY = 'frequency',
  VOLUME = 'volume',
  SPECTROGRAM = 'spectrogram'
}

/**
 * Visualization options
 */
export interface VisualizationOptions {
  /**
   * Type of visualization to generate
   */
  type: VisualizationType;
  
  /**
   * Width of visualization in pixels
   */
  width: number;
  
  /**
   * Height of visualization in pixels
   */
  height: number;
  
  /**
   * Background color (CSS color)
   */
  backgroundColor?: string;
  
  /**
   * Foreground color (CSS color)
   */
  foregroundColor?: string;
  
  /**
   * Whether to show grid lines
   */
  showGrid?: boolean;
  
  /**
   * Grid color (CSS color)
   */
  gridColor?: string;
  
  /**
   * Whether to animate visualization
   */
  animate?: boolean;
  
  /**
   * Number of bars for frequency visualization
   */
  barCount?: number;
  
  /**
   * Bar width for frequency visualization
   */
  barWidth?: number;
  
  /**
   * Gap between bars
   */
  barGap?: number;
  
  /**
   * Bar radius for rounded corners
   */
  barRadius?: number;
  
  /**
   * Line width for waveform visualization
   */
  lineWidth?: number;
  
  /**
   * Gradient colors for visualization
   */
  gradient?: string[];
  
  /**
   * Whether to mirror the visualization
   */
  mirror?: boolean;
  
  /**
   * Normalization factor (0.0 to 1.0)
   */
  normalizationFactor?: number;
}

/**
 * Canvas rendering context (platform-agnostic)
 */
export interface VisualizationContext {
  /**
   * Clear the context
   */
  clear(): void;
  
  /**
   * Set fill style
   */
  setFillStyle(style: string): void;
  
  /**
   * Set stroke style
   */
  setStrokeStyle(style: string): void;
  
  /**
   * Set line width
   */
  setLineWidth(width: number): void;
  
  /**
   * Begin a new path
   */
  beginPath(): void;
  
  /**
   * Move to a point
   */
  moveTo(x: number, y: number): void;
  
  /**
   * Line to a point
   */
  lineTo(x: number, y: number): void;
  
  /**
   * Draw a rectangle
   */
  rect(x: number, y: number, width: number, height: number): void;
  
  /**
   * Draw a rounded rectangle
   */
  roundedRect(x: number, y: number, width: number, height: number, radius: number): void;
  
  /**
   * Fill the current path
   */
  fill(): void;
  
  /**
   * Stroke the current path
   */
  stroke(): void;
  
  /**
   * Create a linear gradient
   */
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): VisualizationGradient;
  
  /**
   * Create a radial gradient
   */
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): VisualizationGradient;
  
  /**
   * Draw text
   */
  fillText(text: string, x: number, y: number): void;
  
  /**
   * Set text alignment
   */
  setTextAlign(align: 'left' | 'right' | 'center' | 'start' | 'end'): void;
  
  /**
   * Set text baseline
   */
  setTextBaseline(baseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom'): void;
  
  /**
   * Set font
   */
  setFont(font: string): void;
  
  /**
   * Save the current state
   */
  save(): void;
  
  /**
   * Restore the previous state
   */
  restore(): void;
}

/**
 * Visualization gradient (platform-agnostic)
 */
export interface VisualizationGradient {
  /**
   * Add a color stop
   */
  addColorStop(offset: number, color: string): void;
}

/**
 * Visualization service interface
 * Platform-agnostic interface for visualization operations
 */
export interface VisualizationService {
  /**
   * Create a visualization context
   */
  createContext(container: any, width: number, height: number): VisualizationContext;
  
  /**
   * Release a visualization context
   */
  releaseContext(context: VisualizationContext): void;
  
  /**
   * Draw audio visualization
   */
  drawAudioVisualization(
    context: VisualizationContext,
    audioData: Uint8Array,
    options: VisualizationOptions
  ): void;
  
  /**
   * Draw word timings visualization
   */
  drawWordTimings(
    context: VisualizationContext,
    wordTimings: Array<{
      word: string;
      startTime: number;
      endTime: number;
    }>,
    currentTime: number,
    totalDuration: number,
    options?: Partial<VisualizationOptions>
  ): void;
  
  /**
   * Draw speech waveform from audio buffer
   */
  drawWaveform(
    context: VisualizationContext,
    audioBuffer: any,
    options?: Partial<VisualizationOptions>
  ): void;
  
  /**
   * Create a waveform image from audio data
   */
  createWaveformImage(
    audioData: Uint8Array | Float32Array,
    options: VisualizationOptions
  ): Promise<string>;
  
  /**
   * Create a spectrogram image from audio data
   */
  createSpectrogramImage(
    audioData: Uint8Array | Float32Array,
    options: VisualizationOptions
  ): Promise<string>;
  
  /**
   * Check if visualization is supported
   */
  isSupported(): boolean;
}
