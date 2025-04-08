import React, { useState, useRef, useEffect } from 'react';
import {
  Chip,
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
  Divider,
  Container
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import TimerIcon from '@mui/icons-material/Timer';
import DebugLog from '../../../shared/components/DebugLog';
import { 
  generateSpeech, 
  getVoicesByGender, 
  feedbackTemplates 
} from '../services/textToSpeechService';
import { formatDuration } from '../../../shared/utils/formatters';

const TextToSpeechGenerator: React.FC = () => {
  // State
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('en-US-Wavenet-F');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [useSSML, setUseSSML] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Voice options
  const [voiceOptions, setVoiceOptions] = useState(getVoicesByGender());
  
  // Audio ref
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

  // Handle synthesis request
  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('Please enter text to synthesize');
      return;
    }

    setError(null);
    setAudioUrl(null);
    setSynthesizing(true);

    try {
      addDebugMessage('Starting speech synthesis...');
      addDebugMessage(`Parameters: Voice=${voiceId}, Speed=${speed}, Pitch=${pitch}, SSML=${useSSML}`);

      const result = await generateSpeech(text, {
        voiceId,
        speed,
        pitch,
        useSSML,
        saveToStorage: true
      });

      addDebugMessage(`Synthesis successful, duration: ${formatDuration(result.durationMs)}`);
      
      // Update state with results
      setAudioUrl(result.dataUrl);
      setProcessingTimeMs(result.processingTimeMs);
      setDurationMs(result.durationMs);
      
    } catch (err: any) {
      console.error('Speech synthesis error:', err);
      setError(`Error generating speech: ${err.message || 'Unknown error'}`);
      addDebugMessage(`ERROR: ${err.message || 'Unknown error'}`);
    } finally {
      setSynthesizing(false);
    }
  };

  // Clear logs
  const handleClearLogs = () => {
    setDebugLogs([]);
  };

  // Filter voices by gender
  const handleGenderFilter = (gender: 'ALL' | 'MALE' | 'FEMALE') => {
    if (gender === 'ALL') {
      setVoiceOptions(getVoicesByGender());
    } else {
      setVoiceOptions(getVoicesByGender(gender));
    }
    addDebugMessage(`Filtered voices by gender: ${gender}`);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Speech Synthesis
        </Typography>
        
        <Typography variant="body1" paragraph>
          Generate natural-sounding speech with customizable voice, speed, and pitch.
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
          
          {useSSML && (
            <Alert severity="info" sx={{ mt: 2 }}>
              SSML allows fine-grained control over speech synthesis. Example: 
              <Typography component="pre" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '0.875rem' }}>
                {`<speak>
  Hello <break time="0.5s"/> world! 
  The <emphasis level="strong">most important</emphasis> part.
</speak>`}
              </Typography>
            </Alert>
          )}
        </Paper>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>2. Voice Settings</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Filter voices by:</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    size="small" 
                    variant={voiceOptions.length === getVoicesByGender().length ? "contained" : "outlined"}
                    onClick={() => handleGenderFilter('ALL')}
                  >
                    All
                  </Button>
                  <Button 
                    size="small" 
                    variant={voiceOptions.length !== getVoicesByGender().length && voiceOptions[0]?.gender === 'MALE' ? "contained" : "outlined"}
                    onClick={() => handleGenderFilter('MALE')}
                  >
                    Male
                  </Button>
                  <Button 
                    size="small" 
                    variant={voiceOptions.length !== getVoicesByGender().length && voiceOptions[0]?.gender === 'FEMALE' ? "contained" : "outlined"}
                    onClick={() => handleGenderFilter('FEMALE')}
                  >
                    Female
                  </Button>
                </Stack>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="voice-select-label">Voice</InputLabel>
                <Select
                  labelId="voice-select-label"
                  value={voiceId}
                  label="Voice"
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  {voiceOptions.map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      {voice.name} ({voice.gender === 'MALE' ? 'Male' : voice.gender === 'FEMALE' ? 'Female' : 'Neutral'})
                      {voice.description && ` - ${voice.description}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} lg={6}>
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
            
            <Grid item xs={12} lg={6}>
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
            ) : 'Generate Speech'}
          </Button>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {audioUrl && (
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
                      ~{durationMs ? Math.round(durationMs / 1000) : 0}s
                    </Typography>
                  </Stack>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                  <Chip 
                    label={`Voice: ${voiceId.split('-').pop()}`} 
                    color="primary"
                    variant="outlined"
                  />
                  
                  <Chip 
                    label={`Speed: ${speed}x`} 
                    variant="outlined"
                  />
                  
                  {processingTimeMs && (
                    <Chip 
                      label={`Processing: ${Math.round(processingTimeMs / 100) / 10}s`} 
                      variant="outlined"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Paper>
        
        {/* Debug logs */}
        <DebugLog 
          logs={debugLogs} 
          onClear={handleClearLogs}
          title="Debug Logs"
        />
      </Box>
    </Container>
  );
};

export default TextToSpeechGenerator;
