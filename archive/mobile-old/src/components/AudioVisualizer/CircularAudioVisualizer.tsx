import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import useAudioLevels from '../../hooks/useAudioLevels';
import { createSmoothAnimation } from '../../utils/animationUtils';

interface CircularAudioVisualizerProps {
  /**
   * Whether the component should be listening for audio levels
   */
  isRecording?: boolean;
  
  /**
   * Style for the container
   */
  style?: ViewStyle;
  
  /**
   * Size of the circle
   */
  size?: number;
  
  /**
   * Minimum size of the inner circle (when silent)
   */
  minInnerSize?: number;
  
  /**
   * Maximum size of the inner circle (when loud)
   */
  maxInnerSize?: number;
  
  /**
   * Color of the outer circle
   */
  outerColor?: string;
  
  /**
   * Color of the inner circle
   */
  innerColor?: string;
  
  /**
   * Pulse animation speed in ms
   */
  pulseSpeed?: number;
}

/**
 * Circular audio visualization component that displays a pulsing circle
 * based on audio levels.
 */
const CircularAudioVisualizer: React.FC<CircularAudioVisualizerProps> = ({
  isRecording = false,
  style,
  size = 120,
  minInnerSize = 40,
  maxInnerSize = 100,
  outerColor = '#F0F5FF',
  innerColor = '#4A55A2',
  pulseSpeed = 300,
}) => {
  // Get audio levels using our custom hook
  const { 
    currentLevel, 
    startListening, 
    stopListening 
  } = useAudioLevels({
    historySize: 10, // We only need current levels for the circular viz
    smoothingFactor: 0.4, // Smoother transition for the circle
    autoStart: false,
  });
  
  // Animated value for the inner circle size
  const innerSizeAnim = useRef(new Animated.Value(minInnerSize)).current;
  
  // Animated value for the pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start/stop listening based on isRecording prop
  useEffect(() => {
    if (isRecording) {
      startListening();
      // Start the pulse animation
      startPulseAnimation();
    } else {
      stopListening();
      // Reset inner circle to minimum size
      Animated.timing(innerSizeAnim, {
        toValue: minInnerSize,
        duration: 300,
        useNativeDriver: false, // We're animating size, not transform
      }).start();
      // Stop pulse animation
      pulseAnim.setValue(1);
    }
    
    return () => {
      stopListening();
    };
  }, [isRecording, startListening, stopListening, minInnerSize, innerSizeAnim, pulseAnim]);
  
  // Animate inner circle size when level changes
  useEffect(() => {
    if (!isRecording) return;
    
    // Calculate target size based on audio level
    const targetSize = minInnerSize + (currentLevel * (maxInnerSize - minInnerSize));
    
    // Animate to the new size
    Animated.timing(innerSizeAnim, {
      toValue: targetSize,
      duration: 200,
      useNativeDriver: false, // We're animating size, not transform
    }).start();
  }, [currentLevel, isRecording, minInnerSize, maxInnerSize, innerSizeAnim]);
  
  // Recursive function to create a continuous pulse animation
  const startPulseAnimation = () => {
    Animated.sequence([
      // Pulse out
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: pulseSpeed,
        useNativeDriver: true,
      }),
      // Pulse in
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: pulseSpeed,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Only continue pulsing if recording
      if (isRecording) {
        startPulseAnimation();
      }
    });
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Outer circle */}
      <View 
        style={[
          styles.outerCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: outerColor,
          }
        ]}
      >
        {/* Inner animated circle */}
        <Animated.View
          style={[
            styles.innerCircle,
            {
              width: innerSizeAnim,
              height: innerSizeAnim,
              borderRadius: innerSizeAnim.interpolate({
                inputRange: [0, 200],
                outputRange: [0, 100],
              }),
              backgroundColor: innerColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularAudioVisualizer;
