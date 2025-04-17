import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';

// Configure haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// Different haptic patterns for various app interactions
export enum HapticPattern {
  // Light feedback
  LIGHT = 'light',
  // Medium feedback
  MEDIUM = 'medium',
  // Heavy feedback
  HEAVY = 'heavy',
  // Success feedback
  SUCCESS = 'success',
  // Error feedback
  ERROR = 'error',
  // Warning feedback
  WARNING = 'warning',
  // Selection change
  SELECTION = 'selection',
  // Recording start/stop
  RECORDING = 'recording',
  // Session completed
  SESSION_COMPLETE = 'session_complete',
  // Milestone achieved
  MILESTONE = 'milestone',
}

class HapticService {
  /**
   * Trigger haptic feedback based on the specified pattern
   */
  trigger(pattern: HapticPattern): void {
    let hapticType: HapticFeedbackTypes;
    
    // Map app-specific patterns to native haptic types
    switch (pattern) {
      case HapticPattern.LIGHT:
        hapticType = HapticFeedbackTypes.soft;
        break;
      case HapticPattern.MEDIUM:
        hapticType = HapticFeedbackTypes.medium;
        break;
      case HapticPattern.HEAVY:
        hapticType = HapticFeedbackTypes.heavy;
        break;
      case HapticPattern.SUCCESS:
        hapticType = HapticFeedbackTypes.success;
        break;
      case HapticPattern.ERROR:
        hapticType = HapticFeedbackTypes.error;
        break;
      case HapticPattern.WARNING:
        hapticType = HapticFeedbackTypes.warning;
        break;
      case HapticPattern.SELECTION:
        hapticType = HapticFeedbackTypes.selection;
        break;
      case HapticPattern.RECORDING:
        hapticType = HapticFeedbackTypes.impactMedium;
        break;
      case HapticPattern.SESSION_COMPLETE:
        // For complex patterns, we can trigger multiple haptics in sequence
        ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.notificationSuccess, hapticOptions);
        setTimeout(() => {
          ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.impactHeavy, hapticOptions);
        }, 150);
        return;
      case HapticPattern.MILESTONE:
        // For milestones, create a distinctive pattern
        ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.soft, hapticOptions);
        setTimeout(() => {
          ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.soft, hapticOptions);
        }, 100);
        setTimeout(() => {
          ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.heavy, hapticOptions);
        }, 250);
        return;
      default:
        hapticType = HapticFeedbackTypes.impactMedium;
    }
    
    ReactNativeHapticFeedback.trigger(hapticType, hapticOptions);
  }
  
  /**
   * Success feedback pattern
   */
  success(): void {
    this.trigger(HapticPattern.SUCCESS);
  }
  
  /**
   * Error feedback pattern
   */
  error(): void {
    this.trigger(HapticPattern.ERROR);
  }
  
  /**
   * Warning feedback pattern
   */
  warning(): void {
    this.trigger(HapticPattern.WARNING);
  }
  
  /**
   * Selection feedback pattern
   */
  selection(): void {
    this.trigger(HapticPattern.SELECTION);
  }
  
  /**
   * Recording toggle feedback
   */
  recording(): void {
    this.trigger(HapticPattern.RECORDING);
  }
  
  /**
   * Session complete feedback
   */
  sessionComplete(): void {
    this.trigger(HapticPattern.SESSION_COMPLETE);
  }
  
  /**
   * Milestone achievement feedback
   */
  milestone(): void {
    this.trigger(HapticPattern.MILESTONE);
  }
  
  /**
   * Custom sequential pattern with varying intensities
   */
  customPattern(patterns: HapticPattern[], intervals: number[]): void {
    if (patterns.length === 0 || patterns.length !== intervals.length + 1) {
      console.error('Invalid pattern sequence');
      return;
    }
    
    // Trigger the first haptic immediately
    this.trigger(patterns[0]);
    
    // Schedule the rest with intervals
    let cumulativeDelay = 0;
    for (let i = 1; i < patterns.length; i++) {
      cumulativeDelay += intervals[i - 1];
      setTimeout(() => {
        this.trigger(patterns[i]);
      }, cumulativeDelay);
    }
  }
}

export const hapticService = new HapticService();
