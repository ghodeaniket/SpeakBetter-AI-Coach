/**
 * Web Visualization Service
 * Implements audio and speech visualization functionality for web platform
 */

import {
  VisualizationService,
  VisualizationContext,
  VisualizationGradient,
  VisualizationOptions,
  VisualizationType
} from '@speakbetter/core/services';

import {
  createAppError,
  ErrorCategory,
  ErrorCodes
} from '@speakbetter/core/models/error';

/**
 * Default visualization options
 */
const DEFAULT_VISUALIZATION_OPTIONS: VisualizationOptions = {
  type: VisualizationType.WAVEFORM,
  width: 300,
  height: 100,
  backgroundColor: 'transparent',
  foregroundColor: '#4A55A2',
  showGrid: false,
  gridColor: 'rgba(74, 85, 162, 0.2)',
  animate: true,
  barCount: 64,
  barWidth: 2,
  barGap: 1,
  barRadius: 2,
  lineWidth: 2,
  mirror: false,
  normalizationFactor: 0.8,
  qualityTier: VisualizationQualityTier.STANDARD
};

/**
 * Quality tier presets with optimized settings for different performance levels
 */
const QUALITY_TIER_PRESETS: Record<VisualizationQualityTier, Partial<VisualizationOptions>> = {
  [VisualizationQualityTier.MINIMAL]: {
    barCount: 32,
    animate: false,
    showGrid: false,
    mirror: false
  },
  [VisualizationQualityTier.STANDARD]: {
    barCount: 64,
    animate: true,
    showGrid: false
  },
  [VisualizationQualityTier.HIGH]: {
    barCount: 128,
    animate: true,
    showGrid: true
  },
  [VisualizationQualityTier.MAXIMUM]: {
    barCount: 256,
    animate: true,
    showGrid: true,
    mirror: true
  }
};

/**
 * Canvas visualization context
 * Implements VisualizationContext for HTML Canvas
 */
class CanvasVisualizationContext implements VisualizationContext {
  private ctx: CanvasRenderingContext2D;
  
  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = context;
  }
  
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  setFillStyle(style: string): void {
    this.ctx.fillStyle = style;
  }
  
  setStrokeStyle(style: string): void {
    this.ctx.strokeStyle = style;
  }
  
  setLineWidth(width: number): void {
    this.ctx.lineWidth = width;
  }
  
  beginPath(): void {
    this.ctx.beginPath();
  }
  
  moveTo(x: number, y: number): void {
    this.ctx.moveTo(x, y);
  }
  
  lineTo(x: number, y: number): void {
    this.ctx.lineTo(x, y);
  }
  
  rect(x: number, y: number, width: number, height: number): void {
    this.ctx.rect(x, y, width, height);
  }
  
  roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  fill(): void {
    this.ctx.fill();
  }
  
  stroke(): void {
    this.ctx.stroke();
  }
  
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): VisualizationGradient {
    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
    return new CanvasGradient(gradient);
  }
  
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): VisualizationGradient {
    const gradient = this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    return new CanvasGradient(gradient);
  }
  
  fillText(text: string, x: number, y: number): void {
    this.ctx.fillText(text, x, y);
  }
  
  setTextAlign(align: 'left' | 'right' | 'center' | 'start' | 'end'): void {
    this.ctx.textAlign = align;
  }
  
  setTextBaseline(baseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom'): void {
    this.ctx.textBaseline = baseline;
  }
  
  setFont(font: string): void {
    this.ctx.font = font;
  }
  
  save(): void {
    this.ctx.save();
  }
  
  restore(): void {
    this.ctx.restore();
  }
}

/**
 * Canvas gradient adapter
 */
class CanvasGradient implements VisualizationGradient {
  constructor(private gradient: CanvasGradient) {}
  
  addColorStop(offset: number, color: string): void {
    this.gradient.addColorStop(offset, color);
  }
}

/**
 * Web implementation of the Visualization Service
 * Uses HTML Canvas for rendering visualizations
 */
export class WebVisualizationService implements VisualizationService {
  /**
   * Animation frame handler
   */
  private animationFrame: number | null = null;
  
  /**
   * Map of contexts to canvas elements
   */
  private contextMap = new Map<VisualizationContext, HTMLCanvasElement>();
  
  /**
   * Map to track animation frames per context
   * Prevents memory leaks from abandoned animation loops
   */
  private animationFramesMap = new Map<VisualizationContext, number>();
  
  /**
   * Track when contexts were last used
   * Helps detect potentially abandoned contexts
   */
  private contextLastUsed = new Map<VisualizationContext, number>();
  
  /**
   * Cleanup interval ID
   */
  private cleanupInterval: number | null = null;
  
  constructor() {
    // Set up periodic cleanup check if in browser environment
    if (typeof window !== 'undefined') {
      this.cleanupInterval = window.setInterval(() => {
        this.checkForAbandonedContexts();
      }, 60000); // Check every minute
    }
  }
  
  /**
   * Detect appropriate visualization quality tier based on device capabilities
   */
  detectQualityTier(): VisualizationQualityTier {
    if (typeof window === 'undefined') {
      return VisualizationQualityTier.STANDARD; // Default for non-browser environments
    }
    
    // Check for low-end mobile devices
    const isLowEndDevice = this.isLowEndDevice();
    if (isLowEndDevice) {
      return VisualizationQualityTier.MINIMAL;
    }
    
    // Check for high-end devices
    const isHighEndDevice = this.isHighEndDevice();
    if (isHighEndDevice) {
      return VisualizationQualityTier.HIGH;
    }
    
    // Default to standard for most devices
    return VisualizationQualityTier.STANDARD;
  }
  
  /**
   * Check if the current device is likely a low-end device
   */
  private isLowEndDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    // Check for low memory (less than 4GB)
    if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
      return true;
    }
    
    // Check for hardware concurrency (less than 4 cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // For mobile devices, perform an additional performance check
    if (isMobile) {
      // Simple performance test - can be enhanced with more sophisticated checks
      const startTime = performance.now();
      let counter = 0;
      for (let i = 0; i < 1000000; i++) {
        counter++;
      }
      const endTime = performance.now();
      
      // If the loop took more than 50ms, consider it a low-end device
      return (endTime - startTime) > 50;
    }
    
    return false;
  }
  
  /**
   * Check if the current device is likely a high-end device
   */
  private isHighEndDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    // Check for high memory (more than 8GB)
    if ('deviceMemory' in navigator && (navigator as any).deviceMemory > 8) {
      return true;
    }
    
    // Check for hardware concurrency (more than 8 cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 8) {
      return true;
    }
    
    // If GPU info is available, we could check that too
    // This is a simplified version
    
    return false;
  }
  
  /**
   * Create a visualization context
   */
  createContext(container: HTMLElement, width: number, height: number): VisualizationContext {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Append to container
    container.appendChild(canvas);
    
    // Create and return context
    const context = new CanvasVisualizationContext(canvas);
    this.contextMap.set(context, canvas);
    
    // Record creation time
    this.contextLastUsed.set(context, Date.now());
    
    return context;
  }
  
  /**
   * Release a visualization context
   */
  releaseContext(context: VisualizationContext): void {
    const canvas = this.contextMap.get(context);
    
    // Cancel any active animation frames for this context
    const animationFrame = this.animationFramesMap.get(context);
    if (animationFrame) {
      if (typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrame);
      }
      this.animationFramesMap.delete(context);
    }
    
    // Remove the canvas from DOM
    if (canvas) {
      // Remove from parent if attached
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
      
      // Clear any WebGL contexts if present
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
      
      // Release mappings
      this.contextMap.delete(context);
      this.contextLastUsed.delete(context);
    }
  }
  
  /**
   * Check for abandoned contexts that haven't been used recently
   * and warn about potential memory leaks
   */
  private checkForAbandonedContexts(): void {
    const now = Date.now();
    const threshold = 5 * 60 * 1000; // 5 minutes
    
    this.contextLastUsed.forEach((lastUsedTime, context) => {
      if (now - lastUsedTime > threshold) {
        console.warn('Potential memory leak: Visualization context has not been used for 5 minutes', {
          lastUsed: new Date(lastUsedTime).toISOString(),
          timeSinceLastUse: Math.floor((now - lastUsedTime) / 1000) + ' seconds'
        });
      }
    });
  }
  
  /**
   * Update the last used timestamp for a context
   */
  private updateContextUsage(context: VisualizationContext): void {
    this.contextLastUsed.set(context, Date.now());
  }
  
  /**
   * Downsample audio data to reduce processing requirements
   * This is useful for low-end devices or when high precision is not required
   * 
   * @param audioData The original audio data
   * @param targetLength The desired output length
   * @returns Downsampled audio data
   */
  private downsampleAudioData(audioData: Uint8Array, targetLength: number): Uint8Array {
    if (audioData.length <= targetLength) {
      return audioData; // No downsampling needed
    }
    
    const result = new Uint8Array(targetLength);
    const ratio = audioData.length / targetLength;
    
    for (let i = 0; i < targetLength; i++) {
      // Calculate the range of samples to average
      const startIndex = Math.floor(i * ratio);
      const endIndex = Math.floor((i + 1) * ratio);
      
      // Calculate average for this range
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += audioData[j];
      }
      
      // Store the average in the result
      const count = endIndex - startIndex;
      result[i] = count > 0 ? Math.floor(sum / count) : 0;
    }
    
    return result;
  }
  
  /**
   * Draw audio visualization
   */
  drawAudioVisualization(
    context: VisualizationContext,
    audioData: Uint8Array,
    options: VisualizationOptions
  ): void {
    // Update last used timestamp
    this.updateContextUsage(context);
    
    // Determine quality tier
    const qualityTier = options.qualityTier || this.detectQualityTier();
    
    // Get quality tier preset
    const qualityPreset = QUALITY_TIER_PRESETS[qualityTier];
    
    // Merge options with the following priority:
    // 1. User-provided options (highest priority)
    // 2. Quality tier preset (middle priority)
    // 3. Default options (lowest priority)
    const visualizationOptions = { 
      ...DEFAULT_VISUALIZATION_OPTIONS, 
      ...qualityPreset,
      ...options 
    };
    
    // For minimal quality, potentially reduce data to improve performance
    let processedAudioData = audioData;
    if (qualityTier === VisualizationQualityTier.MINIMAL && audioData.length > 128) {
      // Downsample data for better performance
      processedAudioData = this.downsampleAudioData(audioData, 128);
    }
    
    // Clear context
    context.clear();
    
    // Draw background if needed
    if (visualizationOptions.backgroundColor !== 'transparent') {
      context.setFillStyle(visualizationOptions.backgroundColor);
      context.rect(0, 0, visualizationOptions.width, visualizationOptions.height);
      context.fill();
    }
    
    // Draw grid if needed
    if (visualizationOptions.showGrid) {
      this.drawGrid(context, visualizationOptions);
    }
    
    // Draw visualization based on type
    switch (visualizationOptions.type) {
      case VisualizationType.WAVEFORM:
        this.drawWaveformVisualization(context, processedAudioData, visualizationOptions);
        break;
      case VisualizationType.FREQUENCY:
        this.drawFrequencyVisualization(context, processedAudioData, visualizationOptions);
        break;
      case VisualizationType.VOLUME:
        this.drawVolumeVisualization(context, processedAudioData, visualizationOptions);
        break;
      case VisualizationType.SPECTROGRAM:
        // Spectrogram may need higher resolution data even at lower quality settings
        // Only use downsampled data for minimal quality
        if (qualityTier === VisualizationQualityTier.MINIMAL) {
          this.drawSpectrogramVisualization(context, processedAudioData, visualizationOptions);
        } else {
          this.drawSpectrogramVisualization(context, audioData, visualizationOptions);
        }
        break;
      default:
        throw new Error(`Unsupported visualization type: ${visualizationOptions.type}`);
    }
  }
  
  /**
   * Draw grid for visualization
   */
  private drawGrid(context: VisualizationContext, options: VisualizationOptions): void {
    const { width, height, gridColor } = options;
    
    // Set grid style
    context.setStrokeStyle(gridColor);
    context.setLineWidth(1);
    
    // Draw horizontal lines
    const horizontalLines = 4;
    const horizontalStep = height / horizontalLines;
    
    for (let i = 1; i < horizontalLines; i++) {
      const y = i * horizontalStep;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    
    // Draw vertical lines
    const verticalLines = 10;
    const verticalStep = width / verticalLines;
    
    for (let i = 1; i < verticalLines; i++) {
      const x = i * verticalStep;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
  }
  
  /**
   * Draw waveform visualization
   */
  private drawWaveformVisualization(
    context: VisualizationContext,
    audioData: Uint8Array,
    options: VisualizationOptions
  ): void {
    const { width, height, foregroundColor, lineWidth, mirror, normalizationFactor } = options;
    
    // Apply normalization factor
    const factor = normalizationFactor || 1.0;
    
    // Center line
    const center = height / 2;
    
    // Set drawing style
    context.setStrokeStyle(foregroundColor);
    context.setLineWidth(lineWidth);
    
    // Create gradient if needed
    let gradient: VisualizationGradient | null = null;
    if (options.gradient && options.gradient.length > 0) {
      gradient = context.createLinearGradient(0, 0, 0, height);
      
      options.gradient.forEach((color, index) => {
        const offset = index / (options.gradient?.length || 1);
        gradient?.addColorStop(offset, color);
      });
    }
    
    // Start drawing path
    context.beginPath();
    
    // Draw waveform
    const sliceWidth = width / audioData.length;
    
    // Start from the left
    context.moveTo(0, center);
    
    // Draw each point
    for (let i = 0; i < audioData.length; i++) {
      const value = audioData[i] / 128.0; // normalize to 0-2
      const y = center + (center * (value - 1) * factor);
      const x = i * sliceWidth;
      
      context.lineTo(x, y);
    }
    
    // If mirroring, draw the bottom half
    if (mirror) {
      for (let i = audioData.length - 1; i >= 0; i--) {
        const value = audioData[i] / 128.0; // normalize to 0-2
        const y = center - (center * (value - 1) * factor);
        const x = i * sliceWidth;
        
        context.lineTo(x, y);
      }
    } else {
      // Otherwise, complete the path back to the right
      context.lineTo(width, center);
    }
    
    // Set gradient if needed
    if (gradient) {
      context.setStrokeStyle(gradient as any);
    }
    
    // Draw the path
    context.stroke();
  }
  
  /**
   * Draw frequency visualization (bar chart)
   */
  private drawFrequencyVisualization(
    context: VisualizationContext,
    audioData: Uint8Array,
    options: VisualizationOptions
  ): void {
    const { 
      width, 
      height, 
      foregroundColor, 
      barCount, 
      barWidth, 
      barGap, 
      barRadius, 
      mirror,
      normalizationFactor 
    } = options;
    
    // Apply normalization factor
    const factor = normalizationFactor || 1.0;
    
    // Center line for mirrored visualization
    const center = mirror ? height / 2 : height;
    
    // Set drawing style
    context.setFillStyle(foregroundColor);
    
    // Create gradient if needed
    let gradient: VisualizationGradient | null = null;
    if (options.gradient && options.gradient.length > 0) {
      gradient = context.createLinearGradient(0, 0, 0, height);
      
      options.gradient.forEach((color, index) => {
        const offset = index / (options.gradient?.length || 1);
        gradient?.addColorStop(offset, color);
      });
      
      context.setFillStyle(gradient as any);
    }
    
    // Calculate bar positions
    const actualBarCount = barCount || 64;
    const step = Math.floor(audioData.length / actualBarCount);
    const actualBarWidth = barWidth || (width / actualBarCount) - barGap;
    
    // Draw bars
    for (let i = 0; i < actualBarCount; i++) {
      // Get average value for this frequency range
      let sum = 0;
      let count = 0;
      
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < audioData.length) {
          sum += audioData[index];
          count++;
        }
      }
      
      const value = count > 0 ? sum / count : 0;
      
      // Normalize value
      const normalizedValue = value / 255.0;
      
      // Calculate bar properties
      const barHeight = normalizedValue * height * factor;
      const x = i * (actualBarWidth + barGap);
      
      if (mirror) {
        // Mirror mode: draw up and down from center
        const halfBarHeight = barHeight / 2;
        const y = center - halfBarHeight;
        
        if (barRadius > 0) {
          context.roundedRect(x, y, actualBarWidth, barHeight, barRadius);
        } else {
          context.rect(x, y, actualBarWidth, barHeight);
        }
      } else {
        // Standard mode: draw from bottom up
        const y = height - barHeight;
        
        if (barRadius > 0 && barHeight > barRadius * 2) {
          context.roundedRect(x, y, actualBarWidth, barHeight, barRadius);
        } else {
          context.rect(x, y, actualBarWidth, barHeight);
        }
      }
      
      context.fill();
    }
  }
  
  /**
   * Draw volume visualization (single volume meter)
   */
  private drawVolumeVisualization(
    context: VisualizationContext,
    audioData: Uint8Array,
    options: VisualizationOptions
  ): void {
    const { width, height, foregroundColor, normalizationFactor } = options;
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i];
    }
    
    const avgVolume = sum / audioData.length;
    
    // Normalize and apply factor
    const normalizedVolume = avgVolume / 255.0;
    const factor = normalizationFactor || 1.0;
    const barWidth = width * 0.8;
    const barHeight = normalizedVolume * height * factor;
    
    // Position bar in center
    const x = (width - barWidth) / 2;
    const y = height - barHeight;
    
    // Create gradient
    let gradient: VisualizationGradient | null = null;
    
    if (options.gradient && options.gradient.length > 0) {
      gradient = context.createLinearGradient(0, height, 0, 0);
      
      options.gradient.forEach((color, index) => {
        const offset = index / (options.gradient?.length || 1);
        gradient?.addColorStop(offset, color);
      });
      
      context.setFillStyle(gradient as any);
    } else {
      context.setFillStyle(foregroundColor);
    }
    
    // Draw bar
    if (options.barRadius && options.barRadius > 0) {
      context.roundedRect(x, y, barWidth, barHeight, options.barRadius);
    } else {
      context.rect(x, y, barWidth, barHeight);
    }
    
    context.fill();
    
    // Draw volume text
    context.setFont('bold 16px sans-serif');
    context.setTextAlign('center');
    context.setTextBaseline('top');
    context.setFillStyle('#333333');
    
    const volumePercent = Math.round(normalizedVolume * 100);
    context.fillText(`${volumePercent}%`, width / 2, 10);
  }
  
  /**
   * Draw spectrogram visualization
   */
  private drawSpectrogramVisualization(
    context: VisualizationContext,
    audioData: Uint8Array,
    options: VisualizationOptions
  ): void {
    const { width, height } = options;
    
    // Spectrogram requires more complex processing
    // This is a simplified version that just draws frequency data as a color map
    
    // Calculate resolution
    const binCount = audioData.length;
    const binWidth = width / binCount;
    
    // Draw each frequency bin as a vertical line with color based on intensity
    for (let i = 0; i < binCount; i++) {
      const x = i * binWidth;
      const intensity = audioData[i] / 255.0;
      
      // Create a color based on intensity (blue to red)
      const r = Math.floor(intensity * 255);
      const g = Math.floor((1 - intensity) * 100);
      const b = Math.floor((1 - intensity) * 255);
      
      context.setFillStyle(`rgb(${r}, ${g}, ${b})`);
      context.rect(x, 0, binWidth + 1, height); // +1 to avoid gaps
      context.fill();
    }
  }
  
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
  ): void {
    // Update last used timestamp
    this.updateContextUsage(context);
    // Merge with default options
    const visualizationOptions = { 
      ...DEFAULT_VISUALIZATION_OPTIONS, 
      ...options,
      width: options?.width || DEFAULT_VISUALIZATION_OPTIONS.width,
      height: options?.height || DEFAULT_VISUALIZATION_OPTIONS.height
    };
    
    const { width, height, backgroundColor, foregroundColor } = visualizationOptions;
    
    // Clear context
    context.clear();
    
    // Draw background if needed
    if (backgroundColor !== 'transparent') {
      context.setFillStyle(backgroundColor);
      context.rect(0, 0, width, height);
      context.fill();
    }
    
    // If no timings or zero duration, return
    if (wordTimings.length === 0 || totalDuration <= 0) {
      return;
    }
    
    // Calculate scale
    const scale = width / totalDuration;
    
    // Draw timeline
    context.setStrokeStyle('#CCCCCC');
    context.setLineWidth(1);
    context.beginPath();
    context.moveTo(0, height - 20);
    context.lineTo(width, height - 20);
    context.stroke();
    
    // Draw time markers
    const markerStep = Math.ceil(totalDuration / 10); // One marker every approx. 10th of duration
    context.setFont('12px sans-serif');
    context.setTextAlign('center');
    context.setFillStyle('#999999');
    
    for (let i = 0; i <= totalDuration; i += markerStep) {
      const x = i * scale;
      
      context.beginPath();
      context.moveTo(x, height - 20);
      context.lineTo(x, height - 15);
      context.stroke();
      
      // Format time as M:SS
      const minutes = Math.floor(i / 60);
      const seconds = Math.floor(i % 60);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      context.fillText(timeStr, x, height - 5);
    }
    
    // Draw words
    context.setFont('14px sans-serif');
    
    for (const timing of wordTimings) {
      const startX = timing.startTime * scale;
      const endX = timing.endTime * scale;
      const wordWidth = endX - startX;
      
      // Determine if word is current
      const isCurrent = 
        currentTime >= timing.startTime && 
        currentTime <= timing.endTime;
      
      // Set word styles
      context.setFillStyle(isCurrent ? '#4A55A2' : '#888888');
      
      // Draw word with slight padding
      const wordY = height / 2;
      context.setTextAlign('center');
      
      const wordCenterX = startX + (wordWidth / 2);
      context.fillText(timing.word, wordCenterX, wordY);
      
      // Draw highlight for current word
      if (isCurrent) {
        context.setStrokeStyle('#4A55A2');
        context.setLineWidth(2);
        
        // Draw underline
        context.beginPath();
        context.moveTo(startX, wordY + 5);
        context.lineTo(endX, wordY + 5);
        context.stroke();
      }
    }
    
    // Draw current time marker
    const currentX = currentTime * scale;
    context.setStrokeStyle('#FF6B6B');
    context.setLineWidth(2);
    context.beginPath();
    context.moveTo(currentX, 0);
    context.lineTo(currentX, height - 20);
    context.stroke();
    
    // Draw marker head
    context.setFillStyle('#FF6B6B');
    context.beginPath();
    context.moveTo(currentX - 5, height - 20);
    context.lineTo(currentX + 5, height - 20);
    context.lineTo(currentX, height - 10);
    context.fill();
  }
  
  /**
   * Draw speech waveform from audio buffer
   */
  drawWaveform(
    context: VisualizationContext,
    audioBuffer: AudioBuffer,
    options?: Partial<VisualizationOptions>
  ): void {
    // Update last used timestamp
    this.updateContextUsage(context);
    const visualizationOptions = { 
      ...DEFAULT_VISUALIZATION_OPTIONS, 
      ...options,
      type: VisualizationType.WAVEFORM,
      width: options?.width || DEFAULT_VISUALIZATION_OPTIONS.width,
      height: options?.height || DEFAULT_VISUALIZATION_OPTIONS.height
    };
    
    // Clear context
    context.clear();
    
    // Get audio data
    const channelData = audioBuffer.getChannelData(0);
    
    // Draw background if needed
    if (visualizationOptions.backgroundColor !== 'transparent') {
      context.setFillStyle(visualizationOptions.backgroundColor);
      context.rect(0, 0, visualizationOptions.width, visualizationOptions.height);
      context.fill();
    }
    
    // Set drawing style
    context.setStrokeStyle(visualizationOptions.foregroundColor);
    context.setLineWidth(visualizationOptions.lineWidth);
    
    // Sample the audio data
    const width = visualizationOptions.width;
    const height = visualizationOptions.height;
    const center = height / 2;
    
    // Determine how many samples to skip
    const sampleRate = audioBuffer.sampleRate;
    const sampleCount = channelData.length;
    const samplesPerPixel = Math.max(1, Math.floor(sampleCount / width));
    
    // Start drawing path
    context.beginPath();
    context.moveTo(0, center);
    
    // Draw the waveform
    for (let i = 0; i < width; i++) {
      // Find the min and max values for this pixel
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < samplesPerPixel; j++) {
        const sampleIndex = (i * samplesPerPixel) + j;
        if (sampleIndex < sampleCount) {
          const sample = channelData[sampleIndex];
          if (sample < min) min = sample;
          if (sample > max) max = sample;
        }
      }
      
      // Apply normalization factor
      const factor = visualizationOptions.normalizationFactor || 1.0;
      min *= factor;
      max *= factor;
      
      // Draw vertical line from min to max
      const y1 = center + (min * center);
      const y2 = center + (max * center);
      
      context.moveTo(i, y1);
      context.lineTo(i, y2);
    }
    
    // Draw the path
    context.stroke();
  }
  
  /**
   * Create a waveform image from audio data
   */
  async createWaveformImage(
    audioData: Uint8Array | Float32Array,
    options: VisualizationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        
        // Create context
        const context = new CanvasVisualizationContext(canvas);
        
        // Convert Float32Array to Uint8Array if needed
        let uint8Data: Uint8Array;
        
        if (audioData instanceof Float32Array) {
          uint8Data = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            // Convert from -1.0...1.0 to 0...255
            uint8Data[i] = ((audioData[i] + 1) / 2) * 255;
          }
        } else {
          uint8Data = audioData;
        }
        
        // Draw waveform
        this.drawAudioVisualization(context, uint8Data, {
          ...options,
          type: VisualizationType.WAVEFORM
        });
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Clean up
        this.releaseContext(context);
        
        resolve(dataUrl);
      } catch (error) {
        reject(createAppError(
          ErrorCodes.VISUALIZATION_ERROR,
          'Failed to create waveform image',
          {
            category: ErrorCategory.AUDIO,
            originalError: error as Error
          }
        ));
      }
    });
  }
  
  /**
   * Create a spectrogram image from audio data
   */
  async createSpectrogramImage(
    audioData: Uint8Array | Float32Array,
    options: VisualizationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        
        // Create context
        const context = new CanvasVisualizationContext(canvas);
        
        // Convert Float32Array to Uint8Array if needed
        let uint8Data: Uint8Array;
        
        if (audioData instanceof Float32Array) {
          uint8Data = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            // Convert from -1.0...1.0 to 0...255
            uint8Data[i] = ((audioData[i] + 1) / 2) * 255;
          }
        } else {
          uint8Data = audioData;
        }
        
        // Draw spectrogram
        this.drawAudioVisualization(context, uint8Data, {
          ...options,
          type: VisualizationType.SPECTROGRAM
        });
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Clean up
        this.releaseContext(context);
        
        resolve(dataUrl);
      } catch (error) {
        reject(createAppError(
          ErrorCodes.VISUALIZATION_ERROR,
          'Failed to create spectrogram image',
          {
            category: ErrorCategory.AUDIO,
            originalError: error as Error
          }
        ));
      }
    });
  }
  
  /**
   * Check if visualization is supported
   */
  isSupported(): boolean {
    return typeof document !== 'undefined' && 
           typeof window !== 'undefined' &&
           !!document.createElement('canvas').getContext('2d');
  }
  
  /**
   * Clean up all resources used by this service
   * Should be called when the service is no longer needed
   */
  cleanup(): void {
    // Cancel the cleanup interval
    if (this.cleanupInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Cancel any pending animation frames
    if (this.animationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Cancel any context-specific animation frames
    if (typeof window !== 'undefined') {
      this.animationFramesMap.forEach((frame) => {
        window.cancelAnimationFrame(frame);
      });
    }
    
    // Release all contexts
    const contexts = Array.from(this.contextMap.keys());
    contexts.forEach(context => {
      this.releaseContext(context);
    });
    
    // Clear all maps
    this.contextMap.clear();
    this.animationFramesMap.clear();
    this.contextLastUsed.clear();
  }
}
