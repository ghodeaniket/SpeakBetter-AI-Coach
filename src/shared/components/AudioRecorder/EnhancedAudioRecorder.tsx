import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Slider,
  Stack, 
  LinearProgress,
  IconButton,
  Alert,
  Tooltip,
  useTheme
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

// Define prop types for the component
interface EnhancedAudioRecorderProps {
  onAudioCaptured?: (audioBlob: Blob) => void;
  maxRecordingTime?: number; // Maximum recording time in seconds
  showVisualizer?: boolean;
  title?: string;
  instructions?: string;
  initialStatus?: RecordingStatus;
}

// Define recording status types
type RecordingStatus = 'idle' | 'recording' | 'paused' | 'completed' | 'error';

const EnhancedAudioRecorder: React.FC<EnhancedAudioRecorderProps> = ({
  onAudioCaptured,
  maxRecordingTime = 180, // Default to 3 minutes
  showVisualizer = true,
  title = "Record Your Speech",
  instructions = "Click the microphone button to start recording, then speak clearly.",
  initialStatus = 'idle'
}) => {
  const theme = useTheme();
  
  // State management
  const [status, setStatus] = useState<RecordingStatus>(initialStatus);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(50).fill(0));
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const hasCalledCaptureCallback = useRef(false);
  
  // Cleanup function to stop all media processes
  const cleanupMedia = () => {
    // Cancel animation frame if active
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear recording interval if active
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping media recorder:", error);
      }
    }
    
    // Stop all tracks in the stream if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      streamRef.current = null;
    }
    
    // Close audio context if active
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.error("Error closing audio context:", error);
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return cleanupMedia;
  }, []);
  
  // Reset callback flag when recording starts
  useEffect(() => {
    if (status === 'recording') {
      hasCalledCaptureCallback.current = false;
    }
  }, [status]);
  
  // Invoke callback when recording completes
  useEffect(() => {
    if (status === 'completed' && audioBlob && onAudioCaptured && !hasCalledCaptureCallback.current) {
      hasCalledCaptureCallback.current = true;
      onAudioCaptured(audioBlob);
    }
  }, [status, audioBlob, onAudioCaptured]);
  
  // Update progress bar based on recording time
  useEffect(() => {
    const progress = (recordingTime / maxRecordingTime) * 100;
    setRecordingProgress(Math.min(progress, 100));
    
    // Auto-stop recording if max time reached
    if (recordingTime >= maxRecordingTime && status === 'recording') {
      stopRecording();
    }
  }, [recordingTime, maxRecordingTime, status]);
  
  // Apply volume changes to audio element
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Start visualizer to analyze audio input
  const startVisualizer = (stream: MediaStream) => {
    if (!showVisualizer) return;
    
    try {
      // Create audio context and analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Setup buffer for analyzer data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Animation function to update visualizer
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Process data for visualization
        // We'll get 50 data points for the visualizer
        const data: number[] = [];
        const step = Math.floor(bufferLength / 50) || 1;
        
        for (let i = 0; i < 50; i++) {
          const index = i * step;
          // Normalize values to 0-100 range for visualization
          data.push((dataArray[index] / 255) * 100);
        }
        
        setVisualizerData(data);
        
        // Continue animation loop
        animationFrameRef.current = window.requestAnimationFrame(updateVisualizer);
      };
      
      // Start the visualization loop
      updateVisualizer();
    } catch (error) {
      console.error("Error setting up audio visualizer:", error);
      setErrorMessage("Failed to initialize audio visualizer. Recording will continue without visualization.");
    }
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setStatus('recording');
      setErrorMessage(null);
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Start visualizer
      startVisualizer(stream);
      
      // Add data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Create blob from audio chunks
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioUrl(url);
        setStatus('completed');
        
        // Clean up stream and visualizer
        cleanupMedia();
      };
      
      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        console.error("Media Recorder error:", event);
        setErrorMessage("An error occurred during recording. Please try again.");
        setStatus('error');
        cleanupMedia();
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data in 100ms chunks
      
      // Start timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      
      let errorMsg = "Failed to access microphone. Please check your permissions and try again.";
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMsg = "Microphone access denied. Please allow microphone access and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMsg = "No microphone found. Please connect a microphone and try again.";
        }
      }
      
      setErrorMessage(errorMsg);
      setStatus('error');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Clear recording interval
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };
  
  // Reset recording
  const resetRecording = () => {
    cleanupMedia();
    
    // Reset state
    setStatus('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setRecordingProgress(0);
    setErrorMessage(null);
    setVisualizerData(Array(50).fill(0));
    setIsPlaying(false);
    hasCalledCaptureCallback.current = false;
  };
  
  // Play/pause audio playback
  const togglePlayback = () => {
    if (!audioElementRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Toggle mute state
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle audio playback ended
  const handlePlaybackEnded = () => {
    setIsPlaying(false);
  };
  
  // Handle volume change
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    setIsMuted(false);
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" color="primary">
          {title}
        </Typography>
        
        {/* Recording time display */}
        {(status === 'recording' || status === 'paused' || status === 'completed') && (
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              color: status === 'recording' ? theme.palette.error.main : theme.palette.text.secondary
            }}
          >
            {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
          </Typography>
        )}
      </Box>
      
      {/* Instructions */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InfoOutlinedIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
        <Typography variant="body2" color="text.secondary">
          {instructions}
        </Typography>
      </Box>
      
      {/* Error message */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      
      {/* Audio visualizer */}
      {showVisualizer && (
        <Box 
          sx={{ 
            height: 100, 
            width: '100%', 
            bgcolor: theme.palette.background.default,
            borderRadius: 1,
            mb: 2,
            p: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 0.5
          }}
        >
          {visualizerData.map((value, index) => (
            <Box 
              key={index} 
              sx={{ 
                width: `calc((100% - 49px) / 50)`,
                height: `${value}%`, 
                bgcolor: theme.palette.primary.main,
                opacity: status === 'recording' ? 1 : 0.3,
                minHeight: 2,
                borderRadius: '1px'
              }} 
            />
          ))}
        </Box>
      )}
      
      {/* Recording progress */}
      {(status === 'recording' || status === 'paused') && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={recordingProgress}
            color={recordingProgress > 90 ? "error" : "primary"}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
      
      {/* Recording controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        {status === 'idle' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MicIcon />}
            onClick={startRecording}
            sx={{ borderRadius: 28, px: 3 }}
          >
            Start Recording
          </Button>
        )}
        
        {status === 'recording' && (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopRecording}
            sx={{ borderRadius: 28, px: 3 }}
          >
            Stop Recording
          </Button>
        )}
        
        {status === 'completed' && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DeleteIcon />}
              onClick={resetRecording}
              sx={{ borderRadius: 28 }}
            >
              Record Again
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              onClick={togglePlayback}
              sx={{ borderRadius: 28 }}
              disabled={!audioUrl}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </Stack>
        )}
        
        {status === 'error' && (
          <Button
            variant="outlined"
            color="primary"
            onClick={resetRecording}
            sx={{ borderRadius: 28 }}
          >
            Try Again
          </Button>
        )}
      </Box>
      
      {/* Audio player for completed recordings */}
      {status === 'completed' && audioUrl && (
        <Box sx={{ width: '100%' }}>
          <audio 
            ref={audioElementRef} 
            src={audioUrl} 
            onEnded={handlePlaybackEnded}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={toggleMute} size="small">
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              min={0}
              max={100}
              size="small"
              sx={{ 
                width: 120, 
                '& .MuiSlider-track': { 
                  bgcolor: theme.palette.primary.main 
                },
                '& .MuiSlider-thumb': { 
                  width: 12, 
                  height: 12 
                }
              }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default EnhancedAudioRecorder;
