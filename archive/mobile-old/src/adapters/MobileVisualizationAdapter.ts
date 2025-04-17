import { Platform } from "react-native";
import { AudioVisualizationData } from "@speakbetter/core/services/audio";

/**
 * Interface for the Visualization Service
 */
export interface VisualizationService {
  /**
   * Create a visualization configuration for a specific type
   */
  createVisualizationConfig(
    type: VisualizationType,
    options?: VisualizationOptions,
  ): VisualizationConfig;

  /**
   * Process audio data for visualization
   */
  processAudioData(data: AudioVisualizationData): VisualizationData;

  /**
   * Get device-specific rendering options
   */
  getDeviceSpecificOptions(): DeviceSpecificOptions;
}

/**
 * Visualization types
 */
export type VisualizationType = "bars" | "wave" | "circle" | "dots";

/**
 * Visualization options
 */
export interface VisualizationOptions {
  barWidth?: number;
  barSpacing?: number;
  barRadius?: number;
  lineWidth?: number;
  smoothing?: number;
  color?: string;
  gradientColors?: string[];
  sensitivity?: number;
  height?: number;
  width?: number;
  responsive?: boolean;
  dynamicHeight?: boolean;
  minBarHeight?: number;
  maxBarHeight?: number;
  backgroundColor?: string;
}

/**
 * Visualization configuration
 */
export interface VisualizationConfig {
  type: VisualizationType;
  options: Required<VisualizationOptions>;
}

/**
 * Visualization data
 */
export interface VisualizationData {
  bars: number[];
  average: number;
  peak: number;
  raw: Uint8Array;
}

/**
 * Device-specific options
 */
export interface DeviceSpecificOptions {
  supportsRealtimeProcessing: boolean;
  preferredFPS: number;
  useNativeDriver: boolean;
  optimizedForRetina: boolean;
  maxDataPoints: number;
}

/**
 * Mobile implementation of the Visualization Service
 */
export class MobileVisualizationAdapter implements VisualizationService {
  private defaultOptions: Required<VisualizationOptions> = {
    barWidth: 4,
    barSpacing: 2,
    barRadius: 2,
    lineWidth: 2,
    smoothing: 0.5,
    color: "#4A55A2", // SpeakBetter primary color
    gradientColors: ["#7986CB", "#4A55A2"],
    sensitivity: 1.2,
    height: 50,
    width: 300,
    responsive: true,
    dynamicHeight: true,
    minBarHeight: 3,
    maxBarHeight: 100,
    backgroundColor: "transparent",
  };

  /**
   * Create a visualization configuration for a specific type
   */
  createVisualizationConfig(
    type: VisualizationType = "bars",
    options?: VisualizationOptions,
  ): VisualizationConfig {
    return {
      type,
      options: {
        ...this.defaultOptions,
        ...options,
      },
    };
  }

  /**
   * Process audio data for visualization
   * @param data Audio visualization data
   * @returns Processed visualization data
   */
  processAudioData(data: AudioVisualizationData): VisualizationData {
    // Get frequency data or generate it if not available
    const frequencyData =
      data.frequencyData.length > 0
        ? data.frequencyData
        : this.generateDummyData(data.averageLevel || 0);

    // Calculate number of bars
    const numBars = 32; // A reasonable default for mobile
    const bars: number[] = [];

    // Process data into bars
    if (frequencyData.length >= numBars) {
      // Use actual data if we have enough
      for (let i = 0; i < numBars; i++) {
        bars.push(frequencyData[i] / 255);
      }
    } else if (frequencyData.length > 0) {
      // Resample if we have some data but not enough
      const step = frequencyData.length / numBars;
      for (let i = 0; i < numBars; i++) {
        const index = Math.min(Math.floor(i * step), frequencyData.length - 1);
        bars.push(frequencyData[index] / 255);
      }
    } else {
      // Generate dummy data if no frequency data
      for (let i = 0; i < numBars; i++) {
        bars.push(Math.random() * data.averageLevel);
      }
    }

    // Apply smoothing
    this.applySmoothing(bars, this.defaultOptions.smoothing);

    return {
      bars,
      average: data.averageLevel,
      peak: data.peakLevel,
      raw: frequencyData,
    };
  }

  /**
   * Get device-specific rendering options
   */
  getDeviceSpecificOptions(): DeviceSpecificOptions {
    const isIOS = Platform.OS === "ios";
    const isHighEndDevice =
      Platform.OS === "ios" &&
      !Platform.isPad &&
      parseInt(String(Platform.Version), 10) >= 14;

    return {
      supportsRealtimeProcessing: true,
      preferredFPS: isHighEndDevice ? 60 : 30,
      useNativeDriver: true,
      optimizedForRetina: isIOS,
      maxDataPoints: isHighEndDevice ? 128 : 64,
    };
  }

  /**
   * Generate dummy data for testing or when real data is not available
   */
  private generateDummyData(level: number): Uint8Array {
    const length = 64;
    const data = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      // Create a somewhat realistic looking pattern
      const normalized = i / length;
      const baseValue = Math.sin(normalized * Math.PI) * 255 * level;

      // Add some randomness
      const randomFactor = 0.2; // 20% randomness
      const randomContribution =
        (Math.random() - 0.5) * 255 * randomFactor * level;

      data[i] = Math.max(0, Math.min(255, baseValue + randomContribution));
    }

    return data;
  }

  /**
   * Apply smoothing to the bars
   */
  private applySmoothing(bars: number[], smoothingFactor: number): void {
    if (bars.length <= 1 || smoothingFactor <= 0) return;

    // Apply moving average
    let prev = bars[0];
    for (let i = 1; i < bars.length; i++) {
      bars[i] = prev * smoothingFactor + bars[i] * (1 - smoothingFactor);
      prev = bars[i];
    }

    // Apply backward smoothing
    prev = bars[bars.length - 1];
    for (let i = bars.length - 2; i >= 0; i--) {
      bars[i] = prev * smoothingFactor + bars[i] * (1 - smoothingFactor);
      prev = bars[i];
    }
  }
}
