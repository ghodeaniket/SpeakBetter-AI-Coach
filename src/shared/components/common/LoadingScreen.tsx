import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  LinearProgress,
  Paper,
  Fade
} from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  progress?: number | null;
  isLoading: boolean;
  transparent?: boolean;
  variant?: 'circular' | 'linear';
  size?: 'small' | 'medium' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  fullScreen = false,
  progress = null,
  isLoading = true,
  transparent = false,
  variant = 'circular',
  size = 'medium'
}) => {
  const theme = useTheme();
  
  if (!isLoading) return null;

  // Calculate sizes based on the size prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return 30;
      case 'large':
        return 60;
      case 'medium':
      default:
        return 40;
    }
  };
  
  const progressSize = getSize();

  // Content for the loading screen
  const loadingContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3
      }}
    >
      {variant === 'circular' ? (
        <CircularProgress
          size={progressSize}
          variant={progress !== null ? 'determinate' : 'indeterminate'}
          value={progress !== null ? progress : undefined}
          sx={{ mb: 2 }}
        />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 300, mb: 2 }}>
          <LinearProgress
            variant={progress !== null ? 'determinate' : 'indeterminate'}
            value={progress !== null ? progress : undefined}
          />
        </Box>
      )}
      
      {message && (
        <Typography 
          variant={size === 'small' ? 'body2' : 'body1'} 
          color="text.secondary"
          gutterBottom
        >
          {message}
        </Typography>
      )}
      
      {progress !== null && (
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  // If fullScreen, render a centered screen overlay
  if (fullScreen) {
    return (
      <Fade in={isLoading} timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.modal + 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: transparent 
              ? 'rgba(255, 255, 255, 0.7)' 
              : theme.palette.background.paper
          }}
        >
          {loadingContent}
        </Box>
      </Fade>
    );
  }

  // Otherwise, render an inline loading indicator
  return transparent ? (
    <Fade in={isLoading} timeout={300}>
      <Box sx={{ width: '100%' }}>{loadingContent}</Box>
    </Fade>
  ) : (
    <Fade in={isLoading} timeout={300}>
      <Paper 
        elevation={1} 
        sx={{ 
          width: '100%', 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {loadingContent}
      </Paper>
    </Fade>
  );
};

export default LoadingScreen;
