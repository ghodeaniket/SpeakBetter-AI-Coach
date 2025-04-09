import React, { useMemo, useEffect, useState } from 'react';
import { Box, useTheme, Paper } from '@mui/material';

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
  showShadow?: boolean;
  visualizerStyle?: 'bars' | 'wave' | 'dots';
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  recordingState,
  barWidth = 3,
  barSpacing = 1,
  barColor,
  backgroundColor = 'transparent',
  height = 60,
  showShadow = true,
  visualizerStyle = 'bars'
}) => {
  const { visualizationData, status, error } = recordingState;
  const theme = useTheme();
  const [activeAnimation, setActiveAnimation] = useState(false);
  
  // Use theme color if no bar color is provided
  const actualBarColor = barColor || theme.palette.primary.main;
  
  // Activate animation after component mounts for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveAnimation(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Generate placeholder bars when not recording
  const placeholderBars = useMemo(() => {
    // Number of bars based on container width (approx 300px)
    const totalBars = Math.floor(300 / (barWidth + barSpacing));
    return Array.from({ length: totalBars }, (_, i) => ({
      height: Math.sin(i * 0.2) * 0.5 * 20 + 15, // Sinusoidal pattern
      delay: i * 0.05 // Slight delay for wave effect
    }));
  }, [barWidth, barSpacing]);
  
  // When in error state
  if (error) {
    return (
      <Paper 
        elevation={0}
        sx={{
          width: '100%',
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.error.light,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          opacity: 0.8
        }}
      >
        {placeholderBars.map((bar, index) => (
          <Box
            key={index}
            sx={{
              width: barWidth,
              height: `${bar.height / 2}px`, // Make them shorter
              backgroundColor: theme.palette.error.main, // Red for error
              borderRadius: visualizerStyle === 'dots' ? '50%' : '2px',
              mx: `${barSpacing / 2}px`,
              opacity: 0.7
            }}
          />
        ))}
      </Paper>
    );
  }
  
  // Show animated placeholder when not recording or no visualization data
  if (!visualizationData || status !== 'recording') {
    const isInactive = status === 'paused' || status === 'completed';
    
    return (
      <Paper
        elevation={showShadow ? 1 : 0}
        sx={{
          width: '100%',
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isInactive ? `rgba(0,0,0,0.03)` : backgroundColor,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          transition: 'all 0.3s ease'
        }}
      >
        {visualizerStyle === 'wave' ? (
          // Wave style visualizer
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <path
              d={`M 0,${height / 2} ${placeholderBars.map((bar, i) => {
                const x = i * (barWidth + barSpacing) + barWidth / 2;
                const y = height / 2 - (bar.height / 2) * (isInactive ? 0.5 : 1);
                return `L ${x},${y}`;
              }).join(' ')} L 300,${height / 2}`}
              fill="none"
              stroke={isInactive ? theme.palette.action.disabled : actualBarColor}
              strokeWidth={2}
              strokeLinecap="round"
              style={{
                animation: activeAnimation && !isInactive 
                  ? 'waveFloat 2s ease-in-out infinite' 
                  : 'none',
              }}
            />
            <style>
              {`
                @keyframes waveFloat {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-5px); }
                }
              `}
            </style>
          </svg>
        ) : (
          // Bars or dots style visualizer
          placeholderBars.map((bar, index) => (
            <Box
              key={index}
              sx={{
                width: visualizerStyle === 'dots' ? barWidth * 2 : barWidth,
                height: visualizerStyle === 'dots' 
                  ? barWidth * 2 // Same width and height for dots
                  : `${bar.height * (isInactive ? 0.5 : 1)}px`,
                backgroundColor: isInactive 
                  ? theme.palette.action.disabled 
                  : actualBarColor,
                borderRadius: visualizerStyle === 'dots' ? '50%' : '2px',
                mx: `${barSpacing / 2}px`,
                animation: activeAnimation && !isInactive 
                  ? `${visualizerStyle === 'dots' ? 'dotPulse' : 'barPulse'} 1.5s infinite ${bar.delay}s` 
                  : 'none',
                opacity: isInactive ? 0.5 : 0.8,
                transition: 'all 0.3s ease',
                transform: visualizerStyle === 'dots'
                  ? `scale(${0.5 + (bar.height / 40)})`
                  : 'none',
              }}
            />
          ))
        )}
        
        <style>
          {`
            @keyframes barPulse {
              0%, 100% { height: var(--original-height); }
              50% { height: calc(var(--original-height) * 1.5); }
            }
            @keyframes dotPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.3); }
            }
          `}
        </style>
      </Paper>
    );
  }
  
  // Calculate maximum value for better normalization
  const maxValue = Math.max(...visualizationData, 60); // Ensure minimum scale
  
  return (
    <Paper
      elevation={showShadow ? 2 : 0}
      sx={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        border: `1px solid ${theme.palette.primary.light}`,
      }}
    >
      {visualizerStyle === 'wave' ? (
        // Live wave visualization
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <path
            d={`M 0,${height / 2} ${visualizationData.map((value, i) => {
              const x = i * (barWidth + barSpacing) + barWidth / 2;
              const normalizedHeight = (value / maxValue) * height * 0.8;
              const y = height / 2 - normalizedHeight / 2;
              return `L ${x},${y}`;
            }).join(' ')} L 300,${height / 2}`}
            fill="none"
            stroke={actualBarColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Live bars or dots visualization
        visualizationData.map((value, index) => {
          // Better normalization for more dynamic visualization
          const normalizedHeight = (value / maxValue) * height * 0.9;
          
          // Adjust color intensity based on amplitude
          const intensity = Math.min(1, 0.4 + (value / maxValue) * 0.6);
          
          // For dots, we'll use scale instead of height
          const scale = visualizerStyle === 'dots' 
            ? Math.max(0.5, value / maxValue * 2) 
            : 1;
            
          return (
            <Box
              key={index}
              sx={{
                width: visualizerStyle === 'dots' ? barWidth * 2 : barWidth,
                height: visualizerStyle === 'dots' 
                  ? barWidth * 2 
                  : `${Math.max(2, normalizedHeight)}px`,
                backgroundColor: actualBarColor,
                borderRadius: visualizerStyle === 'dots' ? '50%' : '2px',
                mx: `${barSpacing / 2}px`,
                transition: 'all 0.05s ease',
                opacity: intensity,
                transform: visualizerStyle === 'dots' ? `scale(${scale})` : 'none',
              }}
            />
          );
        })
      )}
    </Paper>
  );
};

export default AudioVisualizer;
