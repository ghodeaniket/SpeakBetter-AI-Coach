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
  CircularProgress,
  Menu,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CircleIcon from '@mui/icons-material/Circle';
import { useAudioRecording, AudioQualityInfo } from '../../hooks/useAudioRecording';
import AudioVisualizer from './AudioVisualizer';

export interface AudioRecorderProps {
  onAudioCaptured?: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // Maximum recording duration in seconds
  showQualityFeedback?: boolean;
  showAudioControls?: boolean;
  autoStart?: boolean;
  mimeType?: string;
  compressionEnabled?: boolean;
  visualizerStyle?: 'bars' | 'wave' | 'dots';
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioCaptured,
  maxDuration = 180, // Default 3 minutes
  showQualityFeedback = true,
  showAudioControls = true,
  autoStart = false,
  mimeType = 'audio/webm',
  compressionEnabled = true,
  visualizerStyle: initialVisualizerStyle = 'bars'
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
  
  // Local state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState<'bars' | 'wave' | 'dots'>(initialVisualizerStyle);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
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
      onAudioCaptured(audioBlob, duration);
    }
  }, [status, audioBlob, onAudioCaptured, duration]);
  
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
  
  // Handle visualizer style change
  const handleVisualizerStyleChange = (
    _: React.MouseEvent<HTMLElement>,
    newStyle: 'bars' | 'wave' | 'dots',
  ) => {
    if (newStyle !== null) {
      setVisualizerStyle(newStyle);
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
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
      
      {/* Header with visualizer controls and status */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Box>
          {status !== 'inactive' && (
            <Chip
              label={status === 'recording' ? 'Recording' : status === 'paused' ? 'Paused' : 'Completed'}
              color={status === 'recording' ? 'error' : status === 'paused' ? 'warning' : 'success'}
              size="small"
              sx={{ 
                borderRadius: '4px',
                '& .MuiChip-label': {
                  px: 1,
                }
              }}
            />
          )}
        </Box>
        
        {/* Right-side controls */}
        <Box>
          {/* Visualizer style toggle */}
          <ToggleButtonGroup
            value={visualizerStyle}
            exclusive
            onChange={handleVisualizerStyleChange}
            aria-label="visualizer style"
            size="small"
            sx={{ 
              mr: 1,
              '& .MuiToggleButtonGroup-grouped': {
                padding: '4px 8px',
                borderRadius: '4px !important'
              }
            }}
          >
            <ToggleButton value="bars" aria-label="bars">
              <Tooltip title="Bar visualization">
                <ViewWeekIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="wave" aria-label="wave">
              <Tooltip title="Wave visualization">
                <ShowChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="dots" aria-label="dots">
              <Tooltip title="Dot visualization">
                <CircleIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Menu for more options */}
          <IconButton 
            size="small" 
            onClick={handleMenuOpen}
            sx={{ visibility: showAudioControls ? 'visible' : 'hidden' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              setShowDetails(!showDetails);
              handleMenuClose();
            }}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </MenuItem>
            {status === 'completed' && (
              <MenuItem onClick={() => {
                handleClearRecording();
                handleMenuClose();
              }}>
                Clear Recording
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>
      
      {/* Recording Duration & Progress */}
      {(status === 'recording' || status === 'paused') && (
        <Box sx={{ mb: 2 }}>
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
            sx={{ 
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.05)'
            }}
          />
        </Box>
      )}
      
      {/* Recording Quality Alert */}
      {showQualityFeedback && qualityInfo && status === 'recording' && !qualityInfo.isGood && (
        <Alert 
          severity={qualityInfo.issues.includes('clipping') || qualityInfo.issues.includes('interrupted') ? 'error' : 'warning'}
          sx={{ 
            mb: 2, 
            mt: status === 'recording' ? 0 : 2,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
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
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
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
        
        <AudioVisualizer 
          recordingState={recordingState} 
          visualizerStyle={visualizerStyle}
          height={80}
        />
        
        {status === 'completed' && audioUrl && (
          <Box sx={{ width: '100%', height: '100%', p: 1, position: 'relative', zIndex: 1 }}>
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
                  sx={{ 
                    mr: 1,
                    bgcolor: 'primaryLighter.main',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    }
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Slider
                    value={playbackProgress}
                    onChange={handleSeek}
                    aria-labelledby="audio-progress-slider"
                    size="small"
                    sx={{
                      color: 'primary.main',
                      '& .MuiSlider-thumb': {
                        width: 12,
                        height: 12,
                        '&:before': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        },
                        '&:hover, &.Mui-focusVisible, &.Mui-active': {
                          boxShadow: '0 0 0 8px rgba(74, 85, 162, 0.16)',
                        }
                      },
                      '& .MuiSlider-track': {
                        height: 4,
                      },
                      '& .MuiSlider-rail': {
                        height: 4,
                        opacity: 0.2,
                      },
                    }}
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
            sx={{ 
              borderRadius: 28,
              px: 3,
              py: 1,
              boxShadow: (theme) => `0 4px 14px 0 ${theme.palette.primary.light}40`
            }}
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
              sx={{ 
                borderRadius: 28,
                boxShadow: (theme) => `0 4px 14px 0 ${theme.palette.error.light}40`
              }}
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
              sx={{ 
                borderRadius: 28,
                boxShadow: (theme) => `0 4px 14px 0 ${theme.palette.error.light}40`
              }}
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
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f5ff', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>Recording Details</Typography>
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
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            borderRadius: 2
          }}
        >
          {error.message}
        </Alert>
      )}
    </Paper>
  );
};

export default AudioRecorder;
