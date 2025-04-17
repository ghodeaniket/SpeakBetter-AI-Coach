import { Animated, Easing } from 'react-native';

/**
 * Creates a smoother animation sequence for audio visualization
 * 
 * @param value Animated.Value to animate
 * @param toValue Target value for the animation
 * @param duration Duration of the animation in ms
 * @returns Animated.CompositeAnimation that can be started/stopped
 */
export const createSmoothAnimation = (
  value: Animated.Value,
  toValue: number,
  duration: number = 200
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

/**
 * Maps an audio level value (0-1) to a visualization height value
 * 
 * @param level Audio level between 0-1
 * @param minHeight Minimum height when audio is silent
 * @param maxHeight Maximum height when audio is loud
 * @returns Calculated height value
 */
export const mapLevelToHeight = (
  level: number,
  minHeight: number = 5,
  maxHeight: number = 100
): number => {
  // Apply a curve to make visualization more dynamic
  // Square root function makes small sounds more visible
  const curve = Math.sqrt(level);
  return minHeight + curve * (maxHeight - minHeight);
};

/**
 * Creates an array of heights from audio level history
 * with proper spacing for visualization
 * 
 * @param levelHistory Array of audio levels (0-1)
 * @param minHeight Minimum bar height
 * @param maxHeight Maximum bar height
 * @returns Array of height values
 */
export const calculateBarHeights = (
  levelHistory: number[],
  minHeight: number = 5,
  maxHeight: number = 100
): number[] => {
  return levelHistory.map(level => mapLevelToHeight(level, minHeight, maxHeight));
};

/**
 * Generates a color based on the audio level
 * 
 * @param level Audio level (0-1)
 * @param lowColor Color for low levels
 * @param highColor Color for high levels
 * @returns Interpolated color value
 */
export const getColorForLevel = (
  level: number,
  lowColor: string = '#4A55A2',  // SpeakBetter primary color
  highColor: string = '#FF7043'  // SpeakBetter warning color
): string => {
  // Simple interpolation between low and high colors
  // This assumes colors are hex and we're not handling opacity
  
  // Parse colors to RGB
  const parseHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  
  const low = parseHex(lowColor);
  const high = parseHex(highColor);
  
  // Interpolate
  const interpolate = (a: number, b: number, factor: number) => 
    Math.round(a + (b - a) * factor);
    
  const r = interpolate(low.r, high.r, level);
  const g = interpolate(low.g, high.g, level);
  const b = interpolate(low.b, high.b, level);
  
  // Return as hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
