import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';

interface AudioVisualizerProps {
  recordingState: {
    visualizationData: number[] | null;
    status: string;
    error: Error | null;
    duration: number;
  };
  barWidth?: number;
  barSpacing?: number;
  barColor?: string;
  backgroundColor?: string;
  height?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  recordingState,
  barWidth = 3,
  barSpacing = 1,
  barColor,
  backgroundColor = 'transparent',
  height = 60
}) => {
  const { visualizationData, status, error } = recordingState;
  const theme = useTheme();
  
  // Use theme color if no bar color is provided
  const actualBarColor = barColor || theme.palette.primary.main;
  
  // Generate placeholder bars when not recording
  const placeholderBars = useMemo(() => {
    // Number of bars based on container width (approx 300px)
    const totalBars = Math.floor(300 / (barWidth + barSpacing));
    return Array.from({ length: totalBars }, (_, i) => ({
      height: Math.random() * 20 + 5, // Random height between 5 and 25px
      delay: i * 0.05 // Slight delay for wave effect
    }));
  }, [barWidth, barSpacing]);
  
  // Error state visualization
  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {placeholderBars.map((bar, index) => (
          <Box
            key={index}
            sx={{
              width: barWidth,
              height: `${bar.height / 2}px`, // Make them shorter
              backgroundColor: theme.palette.error.main, // Red for error
              borderRadius: '2px',
              mx: `${barSpacing / 2}px`,
              opacity: 0.7
            }}
          />
        ))}
      </Box>
    );
  }
  
  // Show animated placeholder when not recording or no visualization data
  if (!visualizationData || status !== 'recording') {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {placeholderBars.map((bar, index) => (
          <Box
            key={index}
            sx={{
              width: barWidth,
              height: `${bar.height}px`,
              backgroundColor: status === 'paused' 
                ? theme.palette.action.disabled 
                : actualBarColor,
              borderRadius: '2px',
              mx: `${barSpacing / 2}px`,
              animation: status !== 'completed' 
                ? `pulse 1.5s infinite ${bar.delay}s` 
                : 'none',
              opacity: status === 'paused' ? 0.5 : 0.8,
              '@keyframes pulse': {
                '0%, 100%': {
                  height: `${bar.height}px`,
                },
                '50%': {
                  height: `${bar.height * 1.5}px`,
                },
              },
            }}
          />
        ))}
      </Box>
    );
  }
  
  // Calculate maximum value for better normalization
  const maxValue = Math.max(...visualizationData, 60); // Ensure minimum scale
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        position: 'relative'
      }}
    >
      {visualizationData.map((value, index) => {
        // Better normalization for more dynamic visualization
        const normalizedHeight = (value / maxValue) * height;
        
        // Adjust color intensity based on amplitude
        const intensity = Math.min(1, 0.4 + (value / maxValue) * 0.6);
        
        return (
          <Box
            key={index}
            sx={{
              width: barWidth,
              height: `${Math.max(3, normalizedHeight)}px`,
              backgroundColor: actualBarColor,
              borderRadius: '2px',
              mx: `${barSpacing / 2}px`,
              transition: 'height 0.05s ease',
              opacity: intensity
            }}
          />
        );
      })}
    </Box>
  );
};

export default AudioVisualizer;
