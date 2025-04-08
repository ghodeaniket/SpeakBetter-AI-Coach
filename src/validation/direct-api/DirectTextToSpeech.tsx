import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Stack,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import TimerIcon from '@mui/icons-material/Timer';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  synthesizeSpeech, 
  audioContentToDataUrl, 
  availableVoices, 
  defaultCoachVoice,
  SynthesisResult
} from '../../services/google-cloud/textToSpeech';

// Define template texts for coaching feedback
const feedbackTemplates = [
  {
    label: "Positive Feedback",
    text: "Great job with your presentation! Your pacing was excellent, and you spoke with clarity and confidence. I particularly liked how you emphasized the key points with vocal variety."
  },
  {
    label: "Constructive Feedback",
    text: "I noticed you used filler words like 'um' and 'like' quite frequently. Try replacing these with brief pauses to sound more confident. Your content was excellent, but slowing down slightly would help your audience absorb the information better."
  },
  {
    label: "Mixed Feedback",
    text: "Your introduction was engaging and well-paced. I liked your vocal energy throughout the presentation. One area for improvement is to reduce the repetition of certain phrases. Also, try making more eye contact with your audience to build connection."
  },
  {
    label: "Technical Speech",
    text: "The technical aspects of your product demonstration were clearly explained. Your use of specific terminology was appropriate for the audience. Consider adding more real-world examples to illustrate the practical applications of these technical features."
  }
];

interface SynthesisParams {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  useSSML: boolean;
}

const DirectTextToSpeech: React.FC = () => {
  // State
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState(defaultCoachVoice);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [useSSML, setUseSSML] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<SynthesisResult | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to add debug log with timestamp
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setDebugLogs(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`${timeString} - ${message}`);
  };

  // Audio element event handlers
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioRef.current]);

  // Handle play/pause
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Apply a template
  const applyTemplate = (templateText: string) => {
    setText(templateText);
    addDebugMessage(`Applied template: ${templateText.substring(0, 30)}...`);
  };

  // Save audio to Firebase Storage
  const saveAudioToStorage = async (audioContent: Uint8Array): Promise<string> => {
    try {
      const timestamp = new Date().getTime();
      const fileName = `tts_audio/direct_tts_${timestamp}.mp3`;
      const storageRef = ref(storage, fileName);
      
      addDebugMessage(`Saving audio to Storage: ${fileName}`);
      await uploadBytes(storageRef, audioContent);
      
      const url = await getDownloadURL(storageRef);
      addDebugMessage('Audio saved, got download URL');
      return url;
    } catch (error: any) {
      console.error('Error saving audio:', error);
      addDebugMessage(`ERROR saving audio: ${error.message}`);
      throw error;
    }
  };

  // Handle synthesis request
  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('Please enter text to synthesize');
      return;
    }

    setError(null);
    setAudioUrl(null);
    setAudioData(null);
    setSynthesizing(true);

    try {
      const startTime = Date.now();
      addDebugMessage('Starting speech synthesis...');
      addDebugMessage(`Parameters: Voice=${voiceId}, Speed=${speed}, Pitch=${pitch}, SSML=${useSSML}`);

      // Call the speech synthesis API directly
      const synthesisParams: SynthesisParams = {
        text,
        voiceId,
        speed,
        pitch,
        useSSML
      };

      addDebugMessage('Calling Text-to-Speech API directly...');
      const result = await synthesizeSpeech({
        text: synthesisParams.text,
        voiceId: synthesisParams.voiceId,
        speakingRate: synthesisParams.speed,
        pitch: synthesisParams.pitch,
        useSSML: synthesisParams.useSSML
      });

      addDebugMessage(`Synthesis successful, audio size: ${result.audioContent.byteLength} bytes`);
      
      // Save to storage for persistence
      const storageUrl = await saveAudioToStorage(result.audioContent);
      
      // Create data URL for immediate playback
      const dataUrl = audioContentToDataUrl(result.audioContent, result.contentType);
      
      // Update state
      setAudioUrl(dataUrl);
      setAudioData({
        ...result,
        audioUrl: storageUrl
      });
      
      const endTime = Date.now();
      addDebugMessage(`Total processing time: ${endTime - startTime}ms`);
      
    } catch (err: any) {
      console.error('Speech synthesis error:', err);
      setError(`Error generating speech: ${err.message || 'Unknown error'}`);
      addDebugMessage(`ERROR: ${err.message || 'Unknown error'}`);
    } finally {
      setSynthesizing(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Text-to-Speech Direct API Integration
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component uses the Google Cloud Text-to-Speech API directly, bypassing Firebase Extensions.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>1. Enter Text or Select Template</Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Enter text to synthesize..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2" gutterBottom>
          Or select a template:
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {feedbackTemplates.map((template, idx) => (
            <Button
              key={idx}
              variant="outlined"
              size="small"
              onClick={() => applyTemplate(template.text)}
            >
              {template.label}
            </Button>
          ))}
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={useSSML}
              onChange={(e) => setUseSSML(e.target.checked)}
            />
          }
          label="Use SSML (Speech Synthesis Markup Language)"
        />
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>2. Voice Settings</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="voice-select-label">Voice</InputLabel>
              <Select
                labelId="voice-select-label"
                value={voiceId}
                label="Voice"
                onChange={(e) => setVoiceId(e.target.value)}
              >
                {availableVoices.map((voice) => (
                  <MenuItem key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender === 'MALE' ? 'Male' : voice.gender === 'FEMALE' ? 'Female' : 'Neutral'})
                    {voice.description && ` - ${voice.description}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Speed</Typography>
            <Slider
              value={speed}
              min={0.25}
              max={4.0}
              step={0.05}
              marks={[
                { value: 0.25, label: '0.25x' },
                { value: 1, label: '1x' },
                { value: 2, label: '2x' },
                { value: 4, label: '4x' }
              ]}
              valueLabelDisplay="auto"
              onChange={(_, newValue) => setSpeed(newValue as number)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Pitch</Typography>
            <Slider
              value={pitch}
              min={-20}
              max={20}
              step={1}
              marks={[
                { value: -20, label: 'Lower' },
                { value: 0, label: 'Normal' },
                { value: 20, label: 'Higher' }
              ]}
              valueLabelDisplay="auto"
              onChange={(_, newValue) => setPitch(newValue as number)}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>3. Generate Speech</Typography>
        
        <Button
          variant="contained"
          color="primary"
          disabled={!text.trim() || synthesizing}
          onClick={handleSynthesize}
          sx={{ mb: 2 }}
        >
          {synthesizing ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Generating...
            </>
          ) : 'Generate Speech (Direct API)'}
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {audioUrl && audioData && (
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Generated Audio</Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: '#f5f7fa', 
                p: 2, 
                borderRadius: 1,
                mb: 2
              }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={togglePlayback}
                  startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  sx={{ mr: 2 }}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Box sx={{ flexGrow: 1 }}>
                  <audio 
                    ref={audioRef}
                    src={audioUrl} 
                    controls={false} // We're using custom controls
                    style={{ display: 'none' }} // Hide the element
                  />
                  
                  {/* Custom progress indicator would go here in a more advanced version */}
                </Box>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimerIcon fontSize="small" />
                  <Typography variant="body2">
                    ~{Math.round((audioData.durationMs || 5000) / 1000)}s
                  </Typography>
                </Stack>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Stack direction="row" spacing={2}>
                <Chip 
                  label={`Voice: ${voiceId.split('-').pop()}`} 
                  color="primary"
                  variant="outlined"
                />
                
                <Chip 
                  label={`Speed: ${speed}x`} 
                  variant="outlined"
                />
                
                <Chip 
                  label={`Processing: ${Math.round(audioData.processingTimeMs / 100) / 10}s`} 
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        )}
      </Paper>
      
      {/* Debug logs */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Debug Logs
        </Typography>
        
        <Box sx={{ 
          maxHeight: 300, 
          overflowY: 'auto', 
          p: 2, 
          fontFamily: 'monospace', 
          fontSize: '0.875rem',
          bgcolor: '#2b2b2b',
          color: '#f8f8f8',
          borderRadius: 1
        }}>
          {debugLogs.length > 0 ? (
            debugLogs.map((log, index) => (
              <Box key={index} sx={{ mb: 0.5 }}>{log}</Box>
            ))
          ) : (
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#aaa' }}>
              No logs yet. Click "Generate Speech" to see debug information.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DirectTextToSpeech;
