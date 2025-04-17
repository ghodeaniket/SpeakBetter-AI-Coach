import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import useAudioLevels from '../../hooks/useAudioLevels';
import { calculateBarHeights, createSmoothAnimation, getColorForLevel } from '../../utils/animationUtils';

interface AudioVisualizerProps {
  /**
   * Whether the component should be listening for audio levels
   */
  isRecording?: boolean;
  
  /**
   * Style for the container
   */
  style?: ViewStyle;
  
  /**
   * Number of bars to display
   */
  barCount?: number;
  
  /**
   * Width of each bar in the visualization
   */
  barWidth?: number;
  
  /**
   * Space between bars
   */
  barSpacing?: number;
  
  /**
   * Minimum height of a bar when audio is silent
   */
  minBarHeight?: number;
  
  /**
   * Maximum height of a bar when audio is loud
   */
  maxBarHeight?: number;
  
  /**
   * Background color for the container
   */
  backgroundColor?: string;
  
  /**
   * Low level bar color
   */
  lowColor?: string;
  
  /**
   * High level bar color
   */
  highColor?: string;
  
  /**
   * Border radius for bars
   */
  barBorderRadius?: number;
}

/**
 * Audio visualization component that displays real-time audio levels
 * in an animated bar chart format.
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording = false,
  style,
  barCount = 25,
  barWidth = 3,
  barSpacing = 3,
  minBarHeight = 5,
  maxBarHeight = 100,
  backgroundColor = '#F8FAFC',
  lowColor = '#4A55A2', // SpeakBetter primary color
  highColor = '#FF7043', // SpeakBetter warning color
  barBorderRadius = 2,
}) => {
  // Get audio levels using our custom hook
  const { 
    levelHistory, 
    startListening, 
    stopListening 
  } = useAudioLevels({
    historySize: barCount,
    smoothingFactor: 0.3,
    autoStart: false,
  });
  
  // Container width tracking
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  // Determine how many bars we can fit based on container width
  const visibleBarCount = useMemo(() => {
    if (containerWidth === 0) return 0;
    const totalBarWidth = barWidth + barSpacing;
    return Math.min(barCount, Math.floor(containerWidth / totalBarWidth));
  }, [containerWidth, barCount, barWidth, barSpacing]);
  
  // Create animated values for each bar
  const animatedValues = useRef<Animated.Value[]>([]);
  
  // Initialize animated values if needed
  useEffect(() => {
    if (animatedValues.current.length !== barCount) {
      animatedValues.current = Array.from({ length: barCount }, () => new Animated.Value(minBarHeight));
    }
  }, [barCount, minBarHeight]);
  
  // Handle container layout to determine width
  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };
  
  // Start/stop listening based on isRecording prop
  useEffect(() => {
    if (isRecording) {
      startListening();
    } else {
      stopListening();
    }
    
    return () => {
      stopListening();
    };
  }, [isRecording, startListening, stopListening]);
  
  // Animate bars when level history changes
  useEffect(() => {
    if (visibleBarCount === 0) return;
    
    // Calculate heights based on level history
    const heights = calculateBarHeights(
      levelHistory.slice(-visibleBarCount), 
      minBarHeight, 
      maxBarHeight
    );
    
    // Create animations for each bar
    const animations = heights.map((height, index) => {
      return createSmoothAnimation(
        animatedValues.current[index],
        height,
        200 // 200ms for smooth but responsive animation
      );
    });
    
    // Start all animations together
    Animated.parallel(animations).start();
  }, [levelHistory, visibleBarCount, minBarHeight, maxBarHeight]);
  
  // Don't render anything until we know the container width
  if (containerWidth === 0 || visibleBarCount === 0) {
    return <View style={[styles.container, style]} onLayout={onContainerLayout} />;
  }
  
  return (
    <View 
      style={[styles.container, { backgroundColor }, style]} 
      onLayout={onContainerLayout}
    >
      <View style={styles.visualizerContainer}>
        {/* Render the bars */}
        {Array.from({ length: visibleBarCount }).map((_, index) => {
          // Calculate the color based on position (bars on the right show more recent levels)
          const colorPosition = index / visibleBarCount;
          const color = getColorForLevel(colorPosition, lowColor, highColor);
          
          return (
            <Animated.View
              key={`bar-${index}`}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  marginHorizontal: barSpacing / 2,
                  backgroundColor: color,
                  height: animatedValues.current[index],
                  borderRadius: barBorderRadius,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120,
    borderRadius: 6,
    padding: 10,
    justifyContent: 'center',
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  bar: {
    backgroundColor: '#4A55A2',
    width: 3,
    height: 20,
  },
});

export default AudioVisualizer;
