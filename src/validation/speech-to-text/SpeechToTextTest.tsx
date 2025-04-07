import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AudioRecorder from '../../components/AudioRecorder';

// This component is for testing Google Cloud Speech-to-Text API
// In a production app, this would be done via a Cloud Function
// For Sprint 0, we'll need to implement the API call to validate functionality

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  wordLevelInfo?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
  fillerWords?: {
    count: number;
    words: Array<{
      word: string;
      timestamp: number;
    }>;
  };
}

const SpeechToTextTest: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);

  // This is a mock function
  // In production, we would call a Cloud Function that uses the Google Cloud Speech-to-Text API
  const mockTranscribeAudio = async (blob: Blob): Promise<TranscriptionResult> => {
    // For Sprint 0, we'll implement this as a placeholder for actual API interaction
    // This would be replaced with actual API calls in the real implementation
    
    return new Promise((resolve) => {
      // Simulate API processing time
      setTimeout(() => {
        // For testing purposes, let's create a simulated response
        const mockResult: TranscriptionResult = {
          transcript: "This is a mock transcription. In the real implementation, we would send the audio to Google Cloud Speech to Text API and get actual results.",
          confidence: 0.92,
          wordLevelInfo: [
            { word: "This", startTime: 0.1, endTime: 0.3 },
            { word: "is", startTime: 0.3, endTime: 0.4 },
            { word: "a", startTime: 0.4, endTime: 0.5 },
            { word: "mock", startTime: 0.5, endTime: 0.9 },
            // More words would be here
          ],
          fillerWords: {
            count: 3,
            words: [
              { word: "um", timestamp: 1.2 },
              { word: "like", timestamp: 2.5 },
              { word: "uh", timestamp: 4.1 }
            ]
          }
        };
        
        resolve(mockResult);
      }, 2000);
    });
  };

  const handleAudioCaptured = (blob: Blob) => {
    setAudioBlob(blob);
    setTranscriptionResults(null);
    setError(null);
    setAccuracyScore(null);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      setTranscribing(true);
      setError(null);
      
      // In the actual implementation, we would:
      // 1. Upload the audio blob to Cloud Storage
      // 2. Call a Cloud Function to process the audio with Speech-to-Text API
      // 3. Get back the transcription results
      
      const results = await mockTranscribeAudio(audioBlob);
      
      setTranscriptionResults(results);
      
      // Calculate accuracy if reference text is provided
      if (referenceText.trim()) {
        const simpleAccuracy = calculateSimpleAccuracy(results.transcript, referenceText);
        setAccuracyScore(simpleAccuracy);
      }
      
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError('Failed to transcribe audio: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTranscribing(false);
    }
  };

  // A simple word overlap accuracy calculation
  // In a real implementation, we would use more sophisticated measures
  const calculateSimpleAccuracy = (transcript: string, reference: string): number => {
    const transcriptWords = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const referenceWords = reference.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    // Count matching words (this is a very simple approach)
    let matchCount = 0;
    const referenceWordsSet = new Set(referenceWords);
    
    for (const word of transcriptWords) {
      if (referenceWordsSet.has(word)) {
        matchCount++;
      }
    }
    
    // Calculate a simple word overlap score (0-100)
    const totalWords = Math.max(transcriptWords.length, referenceWords.length);
    return Math.round((matchCount / totalWords) * 100);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Speech-to-Text API Testing
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component validates the accuracy and functionality of Google Cloud Speech-to-Text API
        for the SpeakBetter AI Coach. Record audio to test transcription capabilities.
      </Typography>
      
      {/* Audio recorder */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 1: Record Audio Sample
        </Typography>
        
        <AudioRecorder onAudioCaptured={handleAudioCaptured} maxDuration={30} />
      </Paper>
      
      {/* Optional reference text */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 2: Enter Reference Text (Optional)
        </Typography>
        
        <Typography variant="body2" paragraph>
          If you're reading from a script, enter the text here to calculate transcription accuracy.
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Reference Text"
          variant="outlined"
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder="Enter the text you're reading to compare with the transcription..."
        />
      </Paper>
      
      {/* Transcribe button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={transcribeAudio}
          disabled={!audioBlob || transcribing}
          sx={{ minWidth: 200 }}
        >
          {transcribing ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Transcribing...
            </>
          ) : 'Transcribe Audio'}
        </Button>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Results display */}
      {transcriptionResults && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transcription Results
            </Typography>
            
            {accuracyScore !== null && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Accuracy:
                </Typography>
                <Chip 
                  color={accuracyScore >= 90 ? "success" : accuracyScore >= 75 ? "warning" : "error"}
                  label={`${accuracyScore}%`}
                />
              </Box>
            )}
            
            <Typography variant="body1" paragraph>
              <strong>Confidence:</strong> {Math.round(transcriptionResults.confidence * 100)}%
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
              <Typography variant="body1">
                {transcriptionResults.transcript}
              </Typography>
            </Box>
            
            {/* Filler words */}
            {transcriptionResults.fillerWords && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Filler Words ({transcriptionResults.fillerWords.count})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {transcriptionResults.fillerWords.words.map((fillerWord, index) => (
                      <Chip 
                        key={index}
                        label={`${fillerWord.word} (${fillerWord.timestamp.toFixed(1)}s)`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
            
            {/* Word timing */}
            {transcriptionResults.wordLevelInfo && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Word-Level Timing Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" component="div">
                      {transcriptionResults.wordLevelInfo.map((wordInfo, index) => (
                        <Chip 
                          key={index}
                          label={`${wordInfo.word} (${wordInfo.startTime.toFixed(1)}-${wordInfo.endTime.toFixed(1)}s)`}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Implementation notes for Sprint 0 */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Sprint 0 Implementation Notes:</Typography>
        <Typography variant="body2">
          This is a mock implementation for Sprint 0 technical validation. In the actual implementation,
          audio would be sent to Google Cloud Speech-to-Text API via a Cloud Function, and real
          transcription results would be returned. The current version demonstrates the UI and validation
          flow that will be used with the real API.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SpeechToTextTest;
