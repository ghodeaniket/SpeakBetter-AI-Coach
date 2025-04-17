import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  LayoutChangeEvent,
  useColorScheme,
} from "react-native";
import {
  VisualizationType,
  VisualizationOptions,
} from "../../adapters/MobileVisualizationAdapter";
import { mobileServiceFactory } from "../../adapters/MobileServiceFactory";
import { AudioVisualizationData } from "@speakbetter/core/services/audio";

// Define component props
interface AudioVisualizerProps {
  audioData?: AudioVisualizationData;
  type?: VisualizationType;
  options?: VisualizationOptions;
  isRecording?: boolean;
  style?: ViewStyle;
  numberOfBars?: number;
}

/**
 * AudioVisualizer component for iOS
 * Renders real-time audio visualization based on audio data
 */
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  type = "bars",
  options,
  isRecording = false,
  style,
  numberOfBars = 32,
}) => {
  // Get the visualization service
  const visualizationService = useMemo(
    () => mobileServiceFactory.getVisualizationService(),
    [],
  );

  // Get device color scheme for default colors
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Container dimensions
  const [containerWidth, setContainerWidth] = useState(300);
  const [containerHeight, setContainerHeight] = useState(50);

  // Animation values for bars
  const animatedValues = useRef<Animated.Value[]>([]);

  // Initialize animated values if needed
  useEffect(() => {
    if (animatedValues.current.length !== numberOfBars) {
      animatedValues.current = Array(numberOfBars)
        .fill(0)
        .map(() => new Animated.Value(0));
    }
  }, [numberOfBars]);

  // Process visualization data
  const processData = useCallback(
    (data?: AudioVisualizationData) => {
      if (!data) {
        // Use empty data if none provided
        return {
          bars: Array(numberOfBars).fill(0),
          average: 0,
          peak: 0,
          raw: new Uint8Array(0),
        };
      }

      return visualizationService.processAudioData(data);
    },
    [numberOfBars, visualizationService],
  );

  // Update visualization when audio data changes
  useEffect(() => {
    const updateVisualization = () => {
      if (!isRecording) {
        // Reset bars when not recording
        animatedValues.current.forEach((value) => {
          Animated.timing(value, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.exp),
          }).start();
        });
        return;
      }

      // Process audio data
      const visualData = processData(audioData);

      // Animate each bar
      visualData.bars.forEach((barHeight, i) => {
        if (i < animatedValues.current.length) {
          Animated.timing(animatedValues.current[i], {
            toValue: barHeight,
            duration: 100, // Fast enough for real-time
            useNativeDriver: true,
            easing: Easing.out(Easing.linear),
          }).start();
        }
      });
    };

    updateVisualization();
  }, [audioData, isRecording]);

  // Get visualization config
  const visualizationConfig = useMemo(() => {
    return visualizationService.createVisualizationConfig(type, {
      ...options,
      color: options?.color || (isDarkMode ? "#7986CB" : "#4A55A2"),
      backgroundColor: options?.backgroundColor || "transparent",
    });
  }, [type, options, visualizationService, isDarkMode]);

  // Handle layout changes
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  }, []);

  // Calculate bar styling
  const calculatedBarStyles = useMemo(() => {
    const config = visualizationConfig.options;

    // Calculate bar width based on container width and number of bars
    const totalWidth = containerWidth;
    const calculatedBarWidth = Math.max(
      1,
      (totalWidth - (numberOfBars - 1) * config.barSpacing) / numberOfBars,
    );

    const barWidth = config.responsive ? calculatedBarWidth : config.barWidth;

    return {
      barWidth,
      barSpacing: config.barSpacing,
      barRadius: config.barRadius,
      barColor: config.color,
      barGradient: config.gradientColors,
      maxBarHeight: config.maxBarHeight || containerHeight,
      minBarHeight: config.minBarHeight,
    };
  }, [visualizationConfig, containerWidth, containerHeight, numberOfBars]);

  // Render bars visualization
  const renderBars = () => {
    const bars = [];
    const {
      barWidth,
      barSpacing,
      barRadius,
      barColor,
      maxBarHeight,
      minBarHeight,
    } = calculatedBarStyles;

    for (let i = 0; i < numberOfBars; i++) {
      const animatedValue = animatedValues.current[i] || new Animated.Value(0);

      // Calculate height based on animated value
      const height = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [minBarHeight, maxBarHeight],
        extrapolate: "clamp",
      });

      bars.push(
        <Animated.View
          key={`bar-${i}`}
          style={[
            styles.bar,
            {
              width: barWidth,
              backgroundColor: barColor,
              borderRadius: barRadius,
              marginHorizontal: barSpacing / 2,
              height,
            },
          ]}
        />,
      );
    }

    return bars;
  };

  // Render wave visualization
  const renderWave = () => {
    // Create a line approximation for iOS
    // For a full wave, we'd need to use SVG or a custom native component

    // For iOS simplicity, we'll just stagger the bars with negative margins
    const bars = [];
    const { barWidth, barRadius, barColor, maxBarHeight, minBarHeight } =
      calculatedBarStyles;

    for (let i = 0; i < numberOfBars; i++) {
      const animatedValue = animatedValues.current[i] || new Animated.Value(0);

      // Calculate height based on animated value
      const height = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [minBarHeight, maxBarHeight * 0.8],
        extrapolate: "clamp",
      });

      bars.push(
        <Animated.View
          key={`wave-${i}`}
          style={[
            styles.bar,
            {
              width: barWidth,
              backgroundColor: barColor,
              borderRadius: barRadius,
              marginLeft: i === 0 ? 0 : -barWidth * 0.5,
              height,
              position: "relative",
              opacity: 0.7,
            },
          ]}
        />,
      );
    }

    return <View style={styles.waveContainer}>{bars}</View>;
  };

  // Render circle visualization
  const renderCircle = () => {
    const { barColor } = calculatedBarStyles;

    // Use a single animated value for the circle
    const circleScale = new Animated.Value(0);

    // Animate the circle based on the current audio level
    if (isRecording && audioData) {
      const visualData = processData(audioData);
      circleScale.setValue(visualData.average);
    } else {
      circleScale.setValue(0);
    }

    // Calculate the circle size based on container dimensions
    const circleSize = Math.min(containerWidth, containerHeight) * 0.8;

    const animatedSize = circleScale.interpolate({
      inputRange: [0, 1],
      outputRange: [circleSize * 0.5, circleSize],
      extrapolate: "clamp",
    });

    const pulseOpacity = circleScale.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.2, 0.5, 0.3],
      extrapolate: "clamp",
    });

    // Create both the base circle and the pulsing circle
    return (
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: circleSize * 0.5,
              height: circleSize * 0.5,
              borderRadius: circleSize * 0.25,
              backgroundColor: barColor,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              width: animatedSize,
              height: animatedSize,
              borderRadius: animatedSize,
              borderColor: barColor,
              opacity: pulseOpacity,
            },
          ]}
        />
      </View>
    );
  };

  // Render dots visualization
  const renderDots = () => {
    const dots = [];
    const { barWidth, barColor, maxBarHeight } = calculatedBarStyles;

    // Calculate dot size
    const dotSize = barWidth * 1.5;

    for (let i = 0; i < numberOfBars; i++) {
      const animatedValue = animatedValues.current[i] || new Animated.Value(0);

      // Calculate vertical position based on animated value
      const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -maxBarHeight * 0.8],
        extrapolate: "clamp",
      });

      // Calculate scale based on animated value (for a pulsing effect)
      const scale = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1.2, 1],
        extrapolate: "clamp",
      });

      dots.push(
        <Animated.View
          key={`dot-${i}`}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: barColor,
              marginHorizontal: dotSize * 0.3,
              transform: [{ translateY }, { scale }],
            },
          ]}
        />,
      );
    }

    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  // Render the appropriate visualization based on type
  const renderVisualization = () => {
    switch (type) {
      case "wave":
        return renderWave();
      case "circle":
        return renderCircle();
      case "dots":
        return renderDots();
      case "bars":
      default:
        return renderBars();
    }
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {renderVisualization()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bar: {
    alignSelf: "center",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circle: {
    position: "absolute",
  },
  pulseCircle: {
    position: "absolute",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: "100%",
  },
  dot: {
    position: "relative",
  },
});

export default AudioVisualizer;
