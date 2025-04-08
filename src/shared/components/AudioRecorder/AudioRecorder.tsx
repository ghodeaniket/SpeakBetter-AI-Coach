import React, { useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Stack,
  Alert
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useAudioRecording } from '../../hooks';
import AudioVisualizer from './AudioVisualizer';

export interface AudioRecorderProps {
  onAudioCaptured?: (audioBlob: Blob) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioCaptured,
  maxDuration = 180 // Default 3 minutes
}) => {
  const [recordingState, recordingControls] = useAudioRecording({
    maxDuration,
    visualize: true
  });
  
  const { 
    status, 
    audioBlob, 
    audioUrl, 
    duration, 
    error 
  } = recordingState;
  
  const { 
    startRecording, 
    stopRecording, 
    clearRecording 
  } = recordingControls;
  
  // Call onAudioCaptured when recording is completed
  useEffect(() => {
    if (status === 'completed' && audioBlob && onAudioCaptured) {
      onAudioCaptured(audioBlob);
    }
  }, [status, audioBlob, onAudioCaptured]);
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        bgcolor: '#f8fafc' 
      }}
    >
      {/* Recording Visualizer */}
      <Box 
        sx={{ 
          height: 100, 
          mb: 2, 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #e0e4e8',
          overflow: 'hidden'
        }}
      >
        {/* Timer overlay */}
        {(status === 'recording' || status === 'paused') && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              borderRadius: 5,
              px: 1,
              py: 0.5,
              fontSize: '0.8rem',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {status === 'recording' && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                }}
              />
            )}
            {formatDuration(duration)}
          </Box>
        )}
        
        {/* Visualizer or instructions */}
        {status === 'inactive' && !audioUrl && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Click Record to start capturing audio
          </Typography>
        )}
        
        {status === 'recording' && (
          <AudioVisualizer recordingState={recordingState} />
        )}
        
        {status === 'paused' && (
          <Typography variant="body2" color="warning.main" sx={{ textAlign: 'center' }}>
            Recording paused
          </Typography>
        )}
        
        {status === 'completed' && audioUrl && (
          <audio src={audioUrl} controls style={{ width: '100%' }} />
        )}
      </Box>
      
      {/* Controls */}
      <Stack 
        direction="row" 
        spacing={2} 
        justifyContent="center"
        alignItems="center"
      >
        {status === 'inactive' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MicIcon />}
            onClick={startRecording}
            sx={{ borderRadius: 28 }}
          >
            Record
          </Button>
        )}
        
        {status === 'recording' && (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopRecording}
            sx={{ borderRadius: 28 }}
          >
            Stop
          </Button>
        )}
        
        {status === 'paused' && (
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                // Resume recording
              }}
              sx={{ borderRadius: 28 }}
            >
              Resume
            </Button>
            
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{ borderRadius: 28 }}
            >
              Stop
            </Button>
          </>
        )}
        
        {status === 'completed' && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MicIcon />}
            onClick={clearRecording}
            sx={{ borderRadius: 28 }}
          >
            Record New
          </Button>
        )}
        
        {/* Show max duration */}
        {status === 'inactive' && !audioUrl && (
          <Typography variant="caption" color="text.secondary">
            Max: {formatDuration(maxDuration)}
          </Typography>
        )}
      </Stack>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}
    </Paper>
  );
};

export default AudioRecorder;
