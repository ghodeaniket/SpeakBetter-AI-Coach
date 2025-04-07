import React, { useState, useRef, useEffect } from 'react';
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

interface AudioRecorderProps {
  onAudioCaptured?: (audioBlob: Blob) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

type RecordingState = 'inactive' | 'recording' | 'paused' | 'completed';

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioCaptured,
  maxDuration = 180 // Default 3 minutes
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive');
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioSupported, setAudioSupported] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check browser compatibility on component mount
  useEffect(() => {
    const checkAudioSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setAudioSupported(false);
        setError('Audio recording is not supported in this browser');
        return;
      }
      
      try {
        // Just check if we can access the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setAudioSupported(true);
      } catch (err) {
        console.error('Error checking audio support:', err);
        setAudioSupported(false);
        setError('Unable to access microphone');
      }
    };

    checkAudioSupport();
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Reset state
      audioChunksRef.current = [];
      setElapsedTime(0);
      
      // Release previous media stream if exists
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        
        if (onAudioCaptured) {
          onAudioCaptured(audioBlob);
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        setRecordingState('completed');
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState('recording');
      
      // Set up timer
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          // Auto-stop if max duration reached
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
        
        // Update audio level visualization
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate audio level (average of frequency data)
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          const normalizedLevel = average / 256; // Normalize to 0-1 range
          setAudioLevel(normalizedLevel);
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : String(err)));
      setRecordingState('inactive');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioSupported === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress size={24} />
        <Typography ml={2}>Checking audio capabilities...</Typography>
      </Box>
    );
  }

  if (audioSupported === false) {
    return (
      <Box p={2}>
        <Alert severity="error">
          {error || "Audio recording is not supported in this browser. Please try Chrome, Firefox, or Safari."}
        </Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Audio Recorder
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Recording timer and visualizer */}
      <Box 
        sx={{ 
          height: 100, 
          mb: 2, 
          border: '1px solid #ccc', 
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h4">
          {formatTime(elapsedTime)}
        </Typography>
        
        {recordingState === 'recording' && (
          <Box 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: `${Math.max(5, audioLevel * 50)}%`,
              bgcolor: 'primary.main',
              opacity: 0.7,
              transition: 'height 0.1s ease-in-out'
            }} 
          />
        )}
      </Box>
      
      {/* Action buttons */}
      <Stack direction="row" spacing={2} justifyContent="center">
        {recordingState === 'inactive' && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<MicIcon />}
            onClick={startRecording}
          >
            Start Recording
          </Button>
        )}
        
        {recordingState === 'recording' && (
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<StopIcon />}
            onClick={stopRecording}
          >
            Stop
          </Button>
        )}
        
        {recordingState === 'completed' && audioBlobUrl && (
          <>
            <audio ref={audioRef} src={audioBlobUrl} />
            <Button 
              variant="outlined" 
              startIcon={<PlayArrowIcon />}
              onClick={playAudio}
            >
              Play
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PauseIcon />}
              onClick={pauseAudio}
            >
              Pause
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<MicIcon />}
              onClick={startRecording}
            >
              Record Again
            </Button>
          </>
        )}
      </Stack>
      
      {recordingState === 'recording' && (
        <Typography variant="caption" display="block" textAlign="center" mt={1}>
          Max recording time: {formatTime(maxDuration)}
        </Typography>
      )}
      
      {/* Browser compatibility info */}
      <Box mt={3}>
        <Typography variant="caption" display="block" color="text.secondary">
          Browser: {navigator.userAgent}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          Audio recording is supported in this browser ✓
        </Typography>
      </Box>
    </Paper>
  );
};

export default AudioRecorder;
