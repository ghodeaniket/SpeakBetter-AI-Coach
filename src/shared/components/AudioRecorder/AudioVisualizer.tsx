import React from 'react';
import { Box } from '@mui/material';

interface AudioVisualizerProps {
  recordingState: {
    visualizationData: number[] | null;
    status: string;
  };
  barWidth?: number;
  barSpacing?: number;
  barColor?: string;
  backgroundColor?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  recordingState,
  barWidth = 4,
  barSpacing = 2,
  barColor = '#4A55A2',
  backgroundColor = 'transparent'
}) => {
  const { visualizationData, status } = recordingState;
  
  if (!visualizationData || status !== 'recording') {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor
        }}
      >
        <Box
          sx={{
            width: barWidth,
            height: 20,
            backgroundColor: barColor,
            borderRadius: '2px',
            mx: `${barSpacing / 2}px`,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                height: 20,
              },
              '50%': {
                height: 40,
              },
            },
          }}
        />
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor
      }}
    >
      {visualizationData.map((value, index) => {
        // Normalize value to a percentage of the container height
        const normalizedHeight = (value / 255) * 80; // Maximum height 80% of container
        
        return (
          <Box
            key={index}
            sx={{
              width: barWidth,
              height: `${Math.max(5, normalizedHeight)}px`,
              backgroundColor: barColor,
              borderRadius: '2px',
              mx: `${barSpacing / 2}px`,
              transition: 'height 0.1s ease'
            }}
          />
        );
      })}
    </Box>
  );
};

export default AudioVisualizer;
