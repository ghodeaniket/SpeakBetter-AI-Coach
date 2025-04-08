import React, { useEffect, useRef, useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Stack,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Chip,
  Slider,
  Collapse,
  Backdrop,
  CircularProgress
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import { useAudioRecording, AudioQualityInfo } from '../../hooks/useAudioRecording';
import AudioVisualizer from './AudioVisualizer';

export interface AudioRecorderProps {
  onAudioCaptured?: (audioBlob: Blob) => void;
  maxDuration?: number; // Maximum recording duration in seconds
  showQualityFeedback?: boolean;
  showAudioControls?: boolean;
  autoStart?: boolean;
  mimeType?: string;
  compressionEnabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioCaptured,
  maxDuration = 180, // Default 3 minutes
  showQualityFeedback = true,
  showAudioControls = true,
  autoStart = false,
  mimeType = 'audio/webm',
  compressionEnabled = true
}) => {
  const [recordingState, recordingControls] = useAudioRecording({
    maxDuration,
    visualize: true,
    mimeType,
    compressAudio: compressionEnabled
  });
  
  const { 
    status, 
    audioBlob, 
    audioUrl, 
    duration, 
    error,
    qualityInfo,
    recordingFormat
  } = recordingState;
  
  const { 
    startRecording, 
    stopRecording, 
    pauseRecording,
    resumeRecording,
    clearRecording 
  } = recordingControls;
  
  // Local audio playback control
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Reference to track if we've called the callback
  const hasCalledCaptureCallback = useRef(false);
  
  // Reset the callback flag when recording starts
  useEffect(() => {
    if (status === 'recording') {
      hasCalledCaptureCallback.current = false;
    }
  }, [status]);
  
  // Call onAudioCaptured only once when recording completes
  useEffect(() => {
    if (status === 'completed' && audioBlob && onAudioCaptured && !hasCalledCaptureCallback.current) {
      hasCalledCaptureCallback.current = true;
      onAudioCaptured(audioBlob);
    }
  }, [status, audioBlob, onAudioCaptured]);
  
  // Set up audio playback tracking
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const handleTimeUpdate = () => {
      const progress = (audioElement.currentTime / audioElement.duration) * 100;
      setPlaybackProgress(progress);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };
    
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);
  
  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Auto-start recording if enabled
  useEffect(() => {
    if (autoStart && status === 'inactive' && !audioBlob) {
      const startRecordingWithDelay = async () => {
        try {
          setIsLoading(true);
          // Small delay to ensure UI is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          await startRecording();
        } catch (err) {
          console.error('Failed to auto-start recording:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      startRecordingWithDelay();
    }
  }, [autoStart, status, audioBlob, startRecording]);
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle playback control
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    }
  };
  
  // Handle seek in audio playback
  const handleSeek = (_: Event, newValue: number | number[]) => {
    if (!audioRef.current) return;
    
    const seekTime = audioRef.current.duration * (newValue as number) / 100;
    audioRef.current.currentTime = seekTime;
    setPlaybackProgress(newValue as number);
  };
  
  // Handle volume change
  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
  };
  
  // Reset player when recording is cleared
  const handleClearRecording = () => {
    setPlaybackProgress(0);
    setIsPlaying(false);
    setShowDetails(false);
    clearRecording();
  };
  
  // Get quality indicator color
  const getQualityColor = (qualityInfo: AudioQualityInfo | null) => {
    if (!qualityInfo) return 'primary';
    
    if (qualityInfo.isGood) return 'success';
    if (qualityInfo.issues.includes('low-volume') || qualityInfo.issues.includes('high-noise')) {
      return 'warning';
    }
    return 'error';
  };
  
  // Handle start recording with loading state
  const handleStartRecording = async () => {
    try {
      setIsLoading(true);
      await startRecording();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get file size description
  const getFileSizeDescription = () => {
    if (!audioBlob) return 'N/A';
    
    const sizeKB = audioBlob.size / 1024;
    if (sizeKB < 1024) {
      return `${Math.round(sizeKB)} KB`;
    } else {
      return `${(sizeKB / 1024).toFixed(2)} MB`;
    }
  };
  
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        bgcolor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Loading backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute',
          borderRadius: 2
        }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      
      {/* Recording Status Chip */}
      {status !== 'inactive' && (
        <Chip
          label={status === 'recording' ? 'Recording' : status === 'paused' ? 'Paused' : 'Completed'}
          color={status === 'recording' ? 'error' : status === 'paused' ? 'warning' : 'success'}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        />
      )}
      
      {/* Recording Duration & Progress */}
      {(status === 'recording' || status === 'paused') && (
        <Box sx={{ mb: 2, mt: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {formatDuration(duration)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDuration(maxDuration)}
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={(duration / maxDuration) * 100} 
            color={status === 'paused' ? 'warning' : 'primary'}
          />
        </Box>
      )}
      
      {/* Recording Quality Alert */}
      {showQualityFeedback && qualityInfo && status === 'recording' && !qualityInfo.isGood && (
        <Alert 
          severity={qualityInfo.issues.includes('clipping') || qualityInfo.issues.includes('interrupted') ? 'error' : 'warning'}
          sx={{ mb: 2, mt: status === 'recording' ? 0 : 2 }}
          icon={<WarningIcon />}
        >
          {qualityInfo.issues.includes('low-volume') && (
            <Typography variant="body2">
              Your voice is too quiet. Please speak louder or move closer to the microphone.
            </Typography>
          )}
          
          {qualityInfo.issues.includes('high-noise') && (
            <Typography variant="body2">
              High background noise detected. Try to find a quieter environment.
            </Typography>
          )}
          
          {qualityInfo.issues.includes('clipping') && (
            <Typography variant="body2">
              Audio is clipping. Please speak more softly or move away from the microphone.
            </Typography>
          )}
          
          {qualityInfo.issues.includes('interrupted') && (
            <Typography variant="body2">
              Recording seems interrupted. Please speak continuously.
            </Typography>
          )}
        </Alert>
      )}
      
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
          overflow: 'hidden',
          bgcolor: '#ffffff'
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
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            )}
            {formatDuration(duration)}
          </Box>
        )}
        
        {/* Recording quality indicator */}
        {showQualityFeedback && qualityInfo && status === 'recording' && (
          <Tooltip title={
            qualityInfo.isGood 
              ? 'Good audio quality' 
              : `Issues: ${qualityInfo.issues.join(', ').replace(/-/g, ' ')}`
          }>
            <Chip
              icon={<SettingsVoiceIcon fontSize="small" />}
              label={`${qualityInfo.volumeLevel}%`}
              color={getQualityColor(qualityInfo)}
              size="small"
              variant="outlined"
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 1,
              }}
            />
          </Tooltip>
        )}
        
        {/* Visualizer or instructions */}
        {status === 'inactive' && !audioUrl && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Click Record to start capturing audio
          </Typography>
        )}
        
        <AudioVisualizer recordingState={recordingState} />
        
        {status === 'completed' && audioUrl && (
          <Box sx={{ width: '100%', height: '100%', p: 1 }}>
            <audio 
              ref={audioRef}
              src={audioUrl} 
              style={{ display: 'none' }}
            />
            
            {/* Custom player UI */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  color="primary" 
                  onClick={togglePlayback} 
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Slider
                    value={playbackProgress}
                    onChange={handleSeek}
                    aria-labelledby="audio-progress-slider"
                    size="small"
                  />
                </Box>
              </Box>
              
              {showAudioControls && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <SettingsVoiceIcon color="action" fontSize="small" />
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    aria-labelledby="volume-slider"
                    min={0}
                    max={1}
                    step={0.01}
                    size="small"
                    sx={{ width: 100 }}
                  />
                </Stack>
              )}
            </Box>
          </Box>
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
            onClick={handleStartRecording}
            sx={{ borderRadius: 28 }}
          >
            Record
          </Button>
        )}
        
        {status === 'recording' && (
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PauseIcon />}
              onClick={pauseRecording}
              sx={{ borderRadius: 28 }}
            >
              Pause
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
        
        {status === 'paused' && (
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={resumeRecording}
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
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MicIcon />}
              onClick={handleClearRecording}
              sx={{ borderRadius: 28 }}
            >
              Record New
            </Button>
            
            <IconButton
              color="error"
              onClick={handleClearRecording}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
            
            <IconButton
              color="info"
              onClick={() => setShowDetails(!showDetails)}
              size="small"
            >
              <InfoOutlinedIcon />
            </IconButton>
          </>
        )}
        
        {/* Show max duration */}
        {status === 'inactive' && !audioUrl && (
          <Typography variant="caption" color="text.secondary">
            Max: {formatDuration(maxDuration)}
          </Typography>
        )}
      </Stack>
      
      {/* Recording Details */}
      <Collapse in={showDetails}>
        <Box sx={{ mt: 2, p: 1, bgcolor: '#f0f5ff', borderRadius: 1 }}>
          <Typography variant="caption" display="block">
            Format: {recordingFormat || 'Unknown'}
          </Typography>
          <Typography variant="caption" display="block">
            Duration: {formatDuration(duration)}
          </Typography>
          <Typography variant="caption" display="block">
            File Size: {getFileSizeDescription()}
          </Typography>
          {qualityInfo && (
            <Typography variant="caption" display="block">
              Audio Quality: {qualityInfo.isGood ? 'Good' : 'Issues detected'}
            </Typography>
          )}
        </Box>
      </Collapse>
      
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
