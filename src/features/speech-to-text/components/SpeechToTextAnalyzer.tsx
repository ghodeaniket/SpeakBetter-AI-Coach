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
  Divider,
  Container
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AudioRecorder from '../../../shared/components/AudioRecorder';
import DebugLog from '../../../shared/components/DebugLog';
import { useSpeech } from '../../../shared/contexts/SpeechContext';
import { 
  processAudio, 
  calculateAccuracy, 
  getFillerWordPercentage 
} from '../services/speechToTextService';
import { formatSeconds } from '../../../shared/utils/formatters';
import { TranscriptionResult } from '../../../services/google-cloud/speech';

const SpeechToTextAnalyzer: React.FC = () => {
  // Local state
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

  // Add debug message
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setDebugLogs(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`${timeString} - ${message}`);
  };

  // Handle audio captured
  const handleAudioCaptured = (blob: Blob) => {
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    addDebugMessage(`Audio recorded: ${(blob.size / 1024).toFixed(2)} KB`);
  };

  // Transcribe the audio
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
      addDebugMessage('Starting transcription process...');

      const result = await processAudio(audioBlob, {
        uploadToStorage: true,
        languageCode: 'en-US'
      });

      addDebugMessage(`Transcription successful: "${result.transcriptionResult.transcript}"`);
      
      if (result.wordsPerMinute) {
        addDebugMessage(`Speaking rate: ${result.wordsPerMinute} words per minute`);
      }
      
      addDebugMessage(`Clarity score: ${result.clarityScore}/100`);
      
      // If reference text is provided, calculate accuracy
      if (referenceText.trim()) {
        const score = calculateAccuracy(result.transcriptionResult.transcript, referenceText);
        setAccuracyScore(Math.round(score));
        addDebugMessage(`Accuracy score relative to reference: ${Math.round(score)}%`);
      }
      
      // Set results
      setTranscriptionResults(result.transcriptionResult);
      setProcessingTimeMs(result.processingTimeMs);
      
      // If a new URL was generated for the audio, update it
      if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(`Error transcribing audio: ${err.message || 'Unknown error'}`);
      addDebugMessage(`ERROR: ${err.message || 'Unknown error'}`);
    } finally {
      setTranscribing(false);
    }
  };

  // Format filler word percentage
  const getFormattedFillerWordPercentage = (): string => {
    if (!transcriptionResults) {
      return '0%';
    }
    
    const percentage = getFillerWordPercentage(transcriptionResults);
    return `${percentage.toFixed(1)}%`;
  };

  // Clear logs
  const handleClearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Speech Analysis
        </Typography>
        
        <Typography variant="body1" paragraph>
          Record your speech and get detailed analysis including transcription, filler word detection, 
          and speaking rate.
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>1. Record Audio</Typography>
          <AudioRecorder onAudioCaptured={handleAudioCaptured} />
          
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
          <Typography variant="h6" gutterBottom>3. Analyze Speech</Typography>
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
                Analyzing...
              </>
            ) : 'Analyze Speech'}
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
                  
                  <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
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
                        label={`Filler Words: ${transcriptionResults.fillerWords.count} (${getFormattedFillerWordPercentage()})`}
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
                            label={`${wordInfo.word} (${formatSeconds(wordInfo.startTime)})`}
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
                          label={`"${fillerWord.word}" at ${formatSeconds(fillerWord.timestamp)}`}
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
        <DebugLog 
          logs={debugLogs} 
          onClear={handleClearLogs}
          title="Debug Logs"
        />
      </Box>
    </Container>
  );
};

export default SpeechToTextAnalyzer;
