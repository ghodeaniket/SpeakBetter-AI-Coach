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
import { db, storage } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';

interface SynthesisParams {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  useSSML: boolean;
}

interface SynthesisResult {
  audioUrl: string;
  durationMs: number;
  processingTimeMs: number;
}

interface VoiceOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  languageCode: string;
  description: string;
}

const voiceOptions: VoiceOption[] = [
  {
    id: 'en-US-Wavenet-A',
    name: 'WaveNet A',
    gender: 'MALE',
    languageCode: 'en-US',
    description: 'Professional male voice with neutral American accent'
  },
  {
    id: 'en-US-Wavenet-C',
    name: 'WaveNet C',
    gender: 'FEMALE',
    languageCode: 'en-US',
    description: 'Professional female voice with neutral American accent'
  },
  {
    id: 'en-US-Wavenet-D',
    name: 'WaveNet D',
    gender: 'MALE',
    languageCode: 'en-US',
    description: 'Mature male voice with neutral American accent'
  },
  {
    id: 'en-US-Wavenet-F',
    name: 'WaveNet F',
    gender: 'FEMALE',
    languageCode: 'en-US',
    description: 'Friendly female voice with neutral American accent'
  }
];

const sampleFeedbackText = [
  "You're doing a great job with your pacing! I noticed your speech flowed naturally at about 140 words per minute, which is perfect for keeping your audience engaged.",
  "I noticed you used filler words like 'um' and 'like' about 12 times in your presentation. Try replacing these with short pauses to sound more confident and authoritative.",
  "Your voice modulation was excellent. The way you varied your tone helped emphasize key points and kept the content interesting. Keep practicing this technique!",
  "I'd recommend working on your pausing technique. Strategic pauses can give your audience time to absorb important information and add emphasis to your key points."
];

const TextToSpeechLive: React.FC = () => {
  const [synthesisParams, setSynthesisParams] = useState<SynthesisParams>({
    text: sampleFeedbackText[0],
    voiceId: voiceOptions[0].id,
    speed: 1.0,
    pitch: 0,
    useSSML: false
  });
  const [synthesizing, setSynthesizing] = useState(false);
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Function to request text-to-speech conversion using Firebase Extension
  const requestSpeechSynthesis = async (params: SynthesisParams): Promise<string> => {
    // Create a new document in the collection that triggers the Text-to-Speech extension
    // Note: This collection name should match your extension configuration
    const docRef = await addDoc(collection(db, 'tts_requests'), {
      text: params.text,
      voice: params.voiceId,
      speakingRate: params.speed,
      pitch: params.pitch,
      useSSML: params.useSSML,
      createdAt: serverTimestamp()
    });
    
    console.log(`TTS request created with ID: ${docRef.id}`);
    return docRef.id;
  };

  // Function to listen for TTS results
  const listenForSpeechResults = (docId: string): Promise<SynthesisResult> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Listen for updates to the document
      const unsubscribe = onSnapshot(doc(db, 'tts_requests', docId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          
          // Check if the audio has been generated
          if (data.audioUrl || data.status === 'completed') {
            const endTime = Date.now();
            unsubscribe();
            
            // Get the actual audio URL
            let audioPath = data.audioUrl || data.audioFile;
            
            // If we have a storage path but not a direct URL, get the download URL
            if (audioPath && !audioPath.startsWith('http')) {
              getDownloadURL(ref(storage, audioPath))
                .then(url => {
                  resolve({
                    audioUrl: url,
                    durationMs: data.durationMs || 5000, // Fallback duration if not provided
                    processingTimeMs: endTime - startTime
                  });
                })
                .catch(err => {
                  reject(new Error(`Failed to get download URL: ${err.message}`));
                });
            } else if (audioPath) {
              // If we already have a URL, resolve directly
              resolve({
                audioUrl: audioPath,
                durationMs: data.durationMs || 5000,
                processingTimeMs: endTime - startTime
              });
            } else {
              reject(new Error('No audio URL found in the response'));
            }
          } else if (data.status === 'error') {
            unsubscribe();
            reject(new Error(data.error || 'Speech synthesis failed'));
          }
        }
      });
      
      // Set a timeout in case the synthesis takes too long
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Speech synthesis timed out after 60 seconds'));
      }, 60000);
    });
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSynthesisParams({
      ...synthesisParams,
      text: event.target.value
    });
  };
  
  const handleVoiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSynthesisParams({
      ...synthesisParams,
      voiceId: event.target.value as string
    });
  };
  
  const handleSpeedChange = (_event: Event, newValue: number | number[]) => {
    setSynthesisParams({
      ...synthesisParams,
      speed: newValue as number
    });
  };
  
  const handlePitchChange = (_event: Event, newValue: number | number[]) => {
    setSynthesisParams({
      ...synthesisParams,
      pitch: newValue as number
    });
  };
  
  const handleSSMLToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSynthesisParams({
      ...synthesisParams,
      useSSML: event.target.checked
    });
  };

  const synthesizeSpeech = async () => {
    try {
      setSynthesizing(true);
      setError(null);
      setResult(null);
      
      // Step 1: Send the text-to-speech request
      const docId = await requestSpeechSynthesis(synthesisParams);
      setRequestId(docId);
      
      // Step 2: Wait for the processing to complete
      const result = await listenForSpeechResults(docId);
      
      setResult(result);
      
    } catch (err) {
      console.error('Error synthesizing speech:', err);
      setError('Failed to synthesize speech: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSynthesizing(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const loadSampleText = (index: number) => {
    setSynthesisParams({
      ...synthesisParams,
      text: sampleFeedbackText[index]
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Text-to-Speech API Live Testing
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component validates the Firebase Text-to-Speech Extension with real API calls.
        Configure voice settings and generate actual speech samples.
      </Typography>
      
      {/* Text input */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 1: Enter Feedback Text
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Text to Synthesize"
          variant="outlined"
          value={synthesisParams.text}
          onChange={handleTextChange}
          placeholder="Enter the text that the AI coach would say..."
          sx={{ mb: 2 }}
        />
        
        <Typography variant="subtitle2" gutterBottom>
          Sample Feedback Templates:
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {sampleFeedbackText.map((text, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => loadSampleText(index)}
            >
              Sample {index + 1}
            </Button>
          ))}
        </Stack>
        
        <FormControlLabel
          control={
            <Switch
              checked={synthesisParams.useSSML}
              onChange={handleSSMLToggle}
              color="primary"
            />
          }
          label="Use SSML for advanced speech control"
        />
      </Paper>
      
      {/* Voice settings */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 2: Configure Voice Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="voice-select-label">Voice</InputLabel>
              <Select
                labelId="voice-select-label"
                value={synthesisParams.voiceId}
                onChange={handleVoiceChange}
                label="Voice"
              >
                {voiceOptions.map((voice) => (
                  <MenuItem key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender === 'MALE' ? 'Male' : 'Female'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Show selected voice details */}
            {voiceOptions.find(v => v.id === synthesisParams.voiceId) && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {voiceOptions.find(v => v.id === synthesisParams.voiceId)?.description}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography id="speed-slider-label" gutterBottom>
              Speaking Speed: {synthesisParams.speed.toFixed(1)}x
            </Typography>
            <Slider
              aria-labelledby="speed-slider-label"
              value={synthesisParams.speed}
              onChange={handleSpeedChange}
              step={0.1}
              marks
              min={0.5}
              max={1.5}
              valueLabelDisplay="auto"
            />
            
            <Typography id="pitch-slider-label" gutterBottom sx={{ mt: 2 }}>
              Pitch Adjustment: {synthesisParams.pitch > 0 ? '+' : ''}{synthesisParams.pitch.toFixed(1)}
            </Typography>
            <Slider
              aria-labelledby="pitch-slider-label"
              value={synthesisParams.pitch}
              onChange={handlePitchChange}
              step={0.5}
              marks
              min={-5}
              max={5}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Synthesis button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={synthesizeSpeech}
          disabled={synthesizing || !synthesisParams.text.trim()}
          sx={{ minWidth: 200 }}
        >
          {synthesizing ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Generating Speech...
            </>
          ) : 'Generate Speech (Live API)'}
        </Button>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Processing info */}
      {requestId && !result && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Processing request ID: {requestId}
        </Alert>
      )}
      
      {/* Results display */}
      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Synthesized Speech
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <audio 
                ref={audioRef}
                src={result.audioUrl}
                onEnded={handleAudioEnded}
                controls={false}
              />
              
              <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
                divider={<Divider orientation="vertical" flexItem />}
              >
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    onClick={isPlaying ? pauseAudio : playAudio}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </Stack>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimerIcon fontSize="small" />
                  <Typography variant="body2">
                    Duration: {(result.durationMs / 1000).toFixed(1)}s
                  </Typography>
                </Stack>
                
                <Typography variant="body2">
                  Processing Time: {(result.processingTimeMs / 1000).toFixed(2)}s
                </Typography>
              </Stack>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Voice Configuration:
            </Typography>
            <Typography variant="body2">
              Voice: {voiceOptions.find(v => v.id === synthesisParams.voiceId)?.name} | 
              Speed: {synthesisParams.speed.toFixed(1)}x | 
              Pitch: {synthesisParams.pitch > 0 ? '+' : ''}{synthesisParams.pitch.toFixed(1)}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Sprint 0 validation info */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Sprint 0 Live Validation:</Typography>
        <Typography variant="body2">
          This component is using the actual Google Cloud Text-to-Speech API via the Firebase Extension.
          It demonstrates the end-to-end flow from text input to speech output.
          The processing time metric helps validate that we can meet our performance targets.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TextToSpeechLive;
