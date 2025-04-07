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
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  collectionGroup
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

// List of possible collection names used by different TTS extensions
const possibleCollectionNames = [
  'tts_requests',
  'tts-requests',
  'textToSpeech',
  'text-to-speech',
  'tts_api',
  'tts-api',
  'ttsRequests'
];

// List of possible field names for audio content
const possibleAudioFields = [
  'audioContent',
  'output.audioContent',
  'audioUrl',
  'output.audioUrl',
  'url',
  'output.url',
  'audio',
  'output.audio',
  'audioFile',
  'output.audioFile',
  'file',
  'output.file',
  'objectPath',
  'output.objectPath',
  'audioPath',
  'output.audioPath',
  'path',
  'output.path'
];

// List of possible status field names
const possibleStatusFields = [
  'state',
  'status',
  'output.state',
  'output.status',
  'processedState',
  'processedStatus'
];

const TextToSpeechLiveFixed: React.FC = () => {
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add debug log entry
  const addDebugLog = (message: string) => {
    console.log(`[TTS Debug] ${message}`);
    setDebugLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };
  
  // Detect which collections exist and which one to use for TTS
  useEffect(() => {
    const detectCollections = async () => {
      addDebugLog('Detecting available collections for TTS...');
      
      for (const collName of possibleCollectionNames) {
        try {
          const colRef = collection(db, collName);
          const q = query(colRef, limit(1));
          
          const snapshot = await getDocs(q);
          addDebugLog(`Collection "${collName}" exists with ${snapshot.size} documents`);
          
          if (!activeCollection) {
            setActiveCollection(collName);
            addDebugLog(`Selected "${collName}" as the active collection`);
          }
        } catch (err) {
          // Collection might not exist, that's okay
          addDebugLog(`Collection "${collName}" seems unavailable: ${err instanceof Error ? err.message : 'unknown error'}`);
        }
      }
      
      // If no collection was found, default to the expected one
      if (!activeCollection) {
        setActiveCollection('tts_requests');
        addDebugLog('No existing collections found, defaulting to "tts_requests"');
      }
    };
    
    detectCollections();
  }, []);

  // Extract value from document based on possible field names
  const extractField = (data: any, fieldPaths: string[]): any => {
    for (const path of fieldPaths) {
      const parts = path.split('.');
      let value = data;
      
      for (const part of parts) {
        if (value === undefined || value === null) break;
        value = value[part];
      }
      
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    
    return null;
  };
  
  // Function to request text-to-speech conversion using Firebase Extension
  const requestSpeechSynthesis = async (params: SynthesisParams): Promise<string> => {
    try {
      addDebugLog(`Creating TTS request in "${activeCollection}" collection`);
      
      const voiceOption = voiceOptions.find(v => v.id === params.voiceId) || voiceOptions[0];
      
      // Create a comprehensive request document that should work with different extension versions
      const requestData = {
        // Core fields required by most TTS extensions
        input: {
          text: params.text
        },
        voice: {
          languageCode: 'en-US',
          name: params.voiceId,
          ssmlGender: voiceOption.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: params.speed,
          pitch: params.pitch
        },
        
        // Alternative formats some extensions might expect
        text: params.text,
        voiceName: params.voiceId,
        voiceGender: voiceOption.gender,
        languageCode: 'en-US',
        speakingRate: params.speed,
        pitchAdjustment: params.pitch,
        
        // Add metadata and timestamps
        createdAt: serverTimestamp(),
        status: 'pending',
        state: 'PROCESSING'
      };
      
      addDebugLog(`Request data: ${JSON.stringify(requestData, null, 2)}`);
      
      const docRef = await addDoc(collection(db, activeCollection), requestData);
      
      addDebugLog(`TTS request created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating TTS request:', error);
      addDebugLog(`Error creating TTS request: ${error instanceof Error ? error.message : 'unknown error'}`);
      throw error;
    }
  };

  // Function to listen for TTS results
  const listenForSpeechResults = (docId: string): Promise<SynthesisResult> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      addDebugLog(`Listening for TTS results for document ID: ${docId}`);
      
      // Listen for updates to the document in the collection
      const unsubscribe = onSnapshot(doc(db, activeCollection, docId), async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          addDebugLog(`Document updated: ${JSON.stringify(data, null, 2)}`);
          
          // Extract status from various possible fields
          const status = extractField(data, possibleStatusFields);
          addDebugLog(`Extracted status: ${status}`);
          
          // Check if the audio has been generated
          if (
            status === 'SUCCESS' || 
            status === 'COMPLETED' || 
            status === 'completed' || 
            status === 'success'
          ) {
            const endTime = Date.now();
            unsubscribe();
            
            // Try to extract audio content from different possible fields
            const audioContent = extractField(data, possibleAudioFields);
            addDebugLog(`Extracted audio content: ${audioContent}`);
            
            if (audioContent) {
              // Handle different audio content formats
              try {
                if (typeof audioContent === 'string') {
                  // If it's a storage path (not a URL or data URI)
                  if (!audioContent.startsWith('http') && !audioContent.startsWith('data:')) {
                    addDebugLog(`Found storage path: ${audioContent}`);
                    
                    // Try different path formats
                    const possiblePaths = [
                      audioContent,
                      `tts_audio/${audioContent}`,
                      `tts_requests/${audioContent}`,
                      `${activeCollection}/${audioContent}`,
                      `${activeCollection}/${docId}/${audioContent}`,
                      `${docId}/${audioContent}`
                    ];
                    
                    // Try each path until one works
                    for (const path of possiblePaths) {
                      try {
                        addDebugLog(`Trying storage path: ${path}`);
                        const url = await getDownloadURL(ref(storage, path));
                        addDebugLog(`Success! Download URL obtained: ${url}`);
                        
                        return resolve({
                          audioUrl: url,
                          durationMs: data.durationMs || data.duration || 5000,
                          processingTimeMs: endTime - startTime
                        });
                      } catch (err) {
                        addDebugLog(`Failed with path ${path}: ${err instanceof Error ? err.message : 'unknown error'}`);
                        // Continue to the next path
                      }
                    }
                    
                    // If we got here, none of the paths worked
                    reject(new Error('Could not get download URL from any of the possible storage paths'));
                  } else {
                    // Direct URL or data URI
                    addDebugLog(`Found direct URL or data URI: ${audioContent.substring(0, 30)}...`);
                    
                    resolve({
                      audioUrl: audioContent,
                      durationMs: data.durationMs || data.duration || 5000,
                      processingTimeMs: endTime - startTime
                    });
                  }
                } else if (typeof audioContent === 'object') {
                  // Handle case where audioContent is an object with a URL property
                  const objKeys = Object.keys(audioContent);
                  addDebugLog(`Audio content is an object with keys: ${objKeys.join(', ')}`);
                  
                  for (const key of ['url', 'uri', 'audioUrl', 'path']) {
                    if (audioContent[key]) {
                      addDebugLog(`Found URL in object at key: ${key}`);
                      
                      if (typeof audioContent[key] === 'string') {
                        if (!audioContent[key].startsWith('http') && !audioContent[key].startsWith('data:')) {
                          try {
                            addDebugLog(`Getting download URL for: ${audioContent[key]}`);
                            const url = await getDownloadURL(ref(storage, audioContent[key]));
                            
                            return resolve({
                              audioUrl: url,
                              durationMs: data.durationMs || data.duration || 5000,
                              processingTimeMs: endTime - startTime
                            });
                          } catch (err) {
                            addDebugLog(`Failed to get download URL: ${err instanceof Error ? err.message : 'unknown error'}`);
                          }
                        } else {
                          resolve({
                            audioUrl: audioContent[key],
                            durationMs: data.durationMs || data.duration || 5000,
                            processingTimeMs: endTime - startTime
                          });
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                addDebugLog(`Error processing audio content: ${err instanceof Error ? err.message : 'unknown error'}`);
              }
            }
            
            // If we got here, we couldn't extract a usable audio URL
            reject(new Error('Could not extract a usable audio URL from the response'));
          } else if (
            status === 'ERROR' || 
            status === 'error' || 
            status === 'FAILED' || 
            status === 'failed'
          ) {
            const errorMsg = data.error || data.errorMessage || data.message || 'Speech synthesis failed';
            addDebugLog(`Error in TTS response: ${errorMsg}`);
            unsubscribe();
            reject(new Error(errorMsg));
          }
          // Otherwise, keep listening for updates
        }
      }, (err) => {
        addDebugLog(`Error in snapshot listener: ${err.message}`);
        reject(err);
      });
      
      // Set a timeout in case the synthesis takes too long
      setTimeout(() => {
        addDebugLog('Timeout reached after 60 seconds');
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
      setDebugLogs([]);
      
      addDebugLog('Starting speech synthesis');
      addDebugLog(`Using collection: ${activeCollection}`);
      
      // Step 1: Send the text-to-speech request
      const docId = await requestSpeechSynthesis(synthesisParams);
      setRequestId(docId);
      
      // Step 2: Wait for the processing to complete
      addDebugLog('Waiting for processing to complete');
      const result = await listenForSpeechResults(docId);
      
      addDebugLog(`Synthesis completed successfully: ${result.audioUrl}`);
      setResult(result);
      
    } catch (err) {
      console.error('Error synthesizing speech:', err);
      addDebugLog(`Failed to synthesize speech: ${err instanceof Error ? err.message : String(err)}`);
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
        Text-to-Speech API Live Testing (Fixed Version)
      </Typography>
      
      <Typography variant="body1" paragraph>
        Enhanced version with improved error handling and debugging for Firebase Text-to-Speech Extension integration.
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
      
      {/* Collection info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2">
          Current TTS Collection: {activeCollection || "Not detected yet"}
        </Typography>
      </Alert>
      
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
          ) : 'Generate Speech (Enhanced)'}
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
      
      {/* Sprint 0 validation info */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Sprint 0 Live Validation (Fixed Version):</Typography>
        <Typography variant="body2">
          This enhanced component implements multiple approaches for integrating with the Firebase Extension:
        </Typography>
        <ul>
          <li>Automatically detects available collections</li>
          <li>Handles multiple field name patterns</li>
          <li>Supports various response formats</li>
          <li>Provides detailed debug logging</li>
          <li>Tries multiple storage paths for audio retrieval</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default TextToSpeechLiveFixed;
