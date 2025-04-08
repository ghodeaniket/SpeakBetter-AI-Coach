import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AudioRecorder from '../../components/AudioRecorder';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  transcribeAudio, 
  calculateSpeakingRate, 
  calculateClarityScore,
  TranscriptionResult 
} from '../../services/google-cloud/speech';

const DirectSpeechToText: React.FC = () => {
  // State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to add debug messages with local time
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setDebugLogs(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`${timeString} - ${message}`);
  };

  // Function to upload audio to Firebase Storage and get a public URL
  const uploadAudio = async (blob: Blob): Promise<string> => {
    try {
      // Create a unique file name with timestamp
      const timestamp = new Date().getTime();
      const fileName = `speech_samples/direct_test_${timestamp}.webm`;
      const storageRef = ref(storage, fileName);
      
      addDebugMessage(`Uploading audio to ${fileName}...`);
      await uploadBytes(storageRef, blob);
      addDebugMessage('Upload successful, getting download URL...');
      
      const url = await getDownloadURL(storageRef);
      addDebugMessage('Got download URL');
      return url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  };

  // Handle audio recording complete
  const handleAudioRecorded = (blob: Blob) => {
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    addDebugMessage(`Audio recorded: ${(blob.size / 1024).toFixed(2)} KB`);
  };

  // Convert audio blob to format required by Speech-to-Text API
  const prepareSpeechRecognitionRequest = async (blob: Blob): Promise<Uint8Array> => {
    try {
      addDebugMessage('Preparing audio for transcription...');
      const arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Error preparing audio:', error);
      throw error;
    }
  };

  // Transcribe the audio using Google Cloud Speech-to-Text API directly
  const handleTranscribe = async () => {
    if (!audioBlob) {
      setError('Please record audio first');
      return;
    }

    setTranscribing(true);
    setError(null);
    setTranscriptionResults(null);
    setAccuracyScore(null);

    try {
      const startTime = Date.now();
      addDebugMessage('Starting transcription process...');

      // Upload to Firebase Storage for later reference
      const audioUrl = await uploadAudio(audioBlob);
      setAudioUrl(audioUrl);

      // Prepare audio content
      const audioContent = await prepareSpeechRecognitionRequest(audioBlob);
      addDebugMessage(`Audio prepared, size: ${audioContent.length} bytes`);

      // Transcribe using direct API call
      addDebugMessage('Calling Speech-to-Text API directly...');
      const result = await transcribeAudio({
        audioContent,
        languageCode: 'en-US',
        sampleRateHertz: 16000, // WebRTC typically uses 16 kHz
        encoding: 'LINEAR16',
        enableWordTimeOffsets: true,
      });

      addDebugMessage(`Transcription successful: "${result.transcript}"`);
      
      // Calculate additional metrics
      const wordsPerMinute = calculateSpeakingRate(result);
      if (wordsPerMinute) {
        addDebugMessage(`Speaking rate: ${wordsPerMinute} words per minute`);
      }
      
      const clarityScore = calculateClarityScore(result);
      addDebugMessage(`Clarity score: ${clarityScore}/100`);
      
      // If reference text is provided, calculate accuracy
      if (referenceText.trim()) {
        const normalizedReference = referenceText.trim().toLowerCase();
        const normalizedTranscript = result.transcript.trim().toLowerCase();
        
        // Simple similarity score based on length difference and common words
        const referenceWords = new Set(normalizedReference.split(/\s+/));
        const transcriptWords = normalizedTranscript.split(/\s+/);
        
        const commonWords = transcriptWords.filter(word => referenceWords.has(word)).length;
        const maxPossible = Math.max(referenceWords.size, transcriptWords.length);
        
        const similarityScore = maxPossible > 0 ? (commonWords / maxPossible) * 100 : 0;
        setAccuracyScore(Math.round(similarityScore));
        addDebugMessage(`Accuracy score relative to reference: ${Math.round(similarityScore)}%`);
      }
      
      // Store processing time
      const endTime = Date.now();
      setProcessingTimeMs(endTime - startTime);

      // Set results
      setTranscriptionResults(result);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(`Error transcribing audio: ${err.message || 'Unknown error'}`);
      addDebugMessage(`ERROR: ${err.message || 'Unknown error'}`);
    } finally {
      setTranscribing(false);
    }
  };

  // Calculate filler word percentage
  const getFillerWordPercentage = (): string => {
    if (
      !transcriptionResults || 
      !transcriptionResults.fillerWords || 
      !transcriptionResults.wordTimeOffsets ||
      !transcriptionResults.wordTimeOffsets.length
    ) {
      return '0%';
    }
    
    const totalWords = transcriptionResults.wordTimeOffsets.length;
    const fillerCount = transcriptionResults.fillerWords.count;
    const percentage = (fillerCount / totalWords) * 100;
    
    return `${percentage.toFixed(1)}%`;
  };

  // Helper to format time in mm:ss
  const formatTimeSeconds = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Speech-to-Text Direct API Integration
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component uses the Google Cloud Speech-to-Text API directly, bypassing Firebase Extensions.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>1. Record Audio</Typography>
        <AudioRecorder onAudioCaptured={handleAudioRecorded} />
        
        {audioUrl && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>Recorded Audio:</Typography>
            <audio 
              ref={audioRef}
              src={audioUrl} 
              controls 
              style={{ width: '100%' }}
            />
          </Box>
        )}
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>2. Optional: Reference Text</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Provide a reference text to compare against the transcription (optional)
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          placeholder="Enter reference text for accuracy comparison..."
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
        />
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>3. Transcribe</Typography>
        <Button 
          variant="contained" 
          color="primary"
          disabled={!audioBlob || transcribing}
          onClick={handleTranscribe}
          sx={{ mb: 2 }}
        >
          {transcribing ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Transcribing...
            </>
          ) : 'Transcribe Audio (Direct API)'}
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {transcriptionResults && (
          <Box sx={{ mt: 3 }}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Transcription Result</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  {transcriptionResults.transcript}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip 
                    label={`Confidence: ${(transcriptionResults.confidence * 100).toFixed(1)}%`} 
                    color={transcriptionResults.confidence > 0.8 ? "success" : "warning"}
                  />
                  
                  {transcriptionResults.wordTimeOffsets && (
                    <Chip 
                      label={`Words: ${transcriptionResults.wordTimeOffsets.length}`} 
                      color="primary"
                    />
                  )}
                  
                  {transcriptionResults.fillerWords && (
                    <Chip 
                      label={`Filler Words: ${transcriptionResults.fillerWords.count} (${getFillerWordPercentage()})`}
                      color={transcriptionResults.fillerWords.count > 5 ? "error" : "warning"}
                    />
                  )}
                  
                  {processingTimeMs && (
                    <Chip 
                      label={`Processed in ${(processingTimeMs / 1000).toFixed(1)}s`} 
                      variant="outlined"
                    />
                  )}
                </Stack>
                
                {accuracyScore !== null && (
                  <Chip 
                    label={`Reference Accuracy: ${accuracyScore}%`}
                    color={accuracyScore > 85 ? "success" : accuracyScore > 70 ? "warning" : "error"}
                    sx={{ mr: 1 }}
                  />
                )}
              </CardContent>
            </Card>
            
            {/* Word-level analysis */}
            {transcriptionResults.wordTimeOffsets && transcriptionResults.wordTimeOffsets.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Word-Level Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Word-by-word breakdown with timestamps:
                  </Typography>
                  
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {transcriptionResults.wordTimeOffsets.map((wordInfo, index) => {
                      // Check if this word is a filler word
                      const isFillerWord = transcriptionResults.fillerWords?.words.some(
                        fw => fw.word.toLowerCase() === wordInfo.word.toLowerCase() && 
                        Math.abs(fw.timestamp - wordInfo.startTime) < 0.1
                      );
                      
                      return (
                        <Chip
                          key={index}
                          label={`${wordInfo.word} (${formatTimeSeconds(wordInfo.startTime)})`}
                          size="small"
                          color={isFillerWord ? "error" : "default"}
                          sx={{ m: 0.5 }}
                        />
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
            
            {/* Filler words analysis */}
            {transcriptionResults.fillerWords && transcriptionResults.fillerWords.words.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Filler Words Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Detected filler words with timestamps:
                  </Typography>
                  
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {transcriptionResults.fillerWords.words.map((fillerWord, index) => (
                      <Chip
                        key={index}
                        label={`"${fillerWord.word}" at ${formatTimeSeconds(fillerWord.timestamp)}`}
                        size="small"
                        color="error"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
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
              No logs yet. Record audio and transcribe to see debug information.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DirectSpeechToText;
