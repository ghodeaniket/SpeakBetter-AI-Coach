import React, { useState, useEffect } from 'react';
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
import { storage, db } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

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

const SpeechToTextLive: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);

  // Function to upload audio to Firebase Storage
  const uploadAudioForTranscription = async (blob: Blob): Promise<string> => {
    // Create a unique file name
    const fileName = `speech_samples/test_${Date.now()}.webm`;
    const storageRef = ref(storage, fileName);
    
    // Upload the blob
    const startTime = Date.now();
    await uploadBytes(storageRef, blob);
    console.log(`Audio uploaded to ${fileName}`);
    
    // Return the file path
    return fileName;
  };

  // Function to check for transcription results in Firestore
  const listenForTranscriptionResults = async (filePath: string): Promise<TranscriptionResult> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Updated to use the correct collection name from the Firebase Extension
      const transcriptionsRef = collection(db, 'transcriptions');
      
      // Create a query to find the matching document
      // Note: Your extension might use a different structure - adjust accordingly
      const q = query(
        transcriptionsRef, 
        where('audioPath', '==', filePath), 
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      // Listen for the document to be created or updated
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          
          // Check if the transcription is complete
          if (data.status === 'completed' || data.transcript) {
            const endTime = Date.now();
            setProcessingTimeMs(endTime - startTime);
            
            unsubscribe();
            
            // Parse and process the transcription data
            // This structure will depend on your extension's output format
            const filler_words = extractFillerWords(data.transcript || '');
            
            resolve({
              transcript: data.transcript || '',
              confidence: data.confidence || 0.9,
              fillerWords: {
                count: filler_words.length,
                words: filler_words.map(w => ({
                  word: w.word,
                  timestamp: w.timestamp
                }))
              }
            });
          } else if (data.status === 'error') {
            unsubscribe();
            reject(new Error(data.error || 'Transcription failed'));
          }
        }
      });
      
      // Set a timeout in case the transcription takes too long
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Transcription timed out after 60 seconds'));
      }, 60000);
    });
  };

  // Simple function to find filler words
  const extractFillerWords = (transcript: string): Array<{word: string, timestamp: number}> => {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally'];
    const results: Array<{word: string, timestamp: number}> = [];
    
    // This is a simplified approach - in a real app you'd use the word timings from the API
    const words = transcript.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      if (fillerWords.includes(word)) {
        // Estimate timestamp based on word position
        // In a real implementation, you'd use the actual timestamps from the API
        const estimatedTimestamp = index * 0.3; // rough estimate
        
        results.push({
          word,
          timestamp: estimatedTimestamp
        });
      }
    });
    
    return results;
  };

  const handleAudioCaptured = (blob: Blob) => {
    setAudioBlob(blob);
    setTranscriptionResults(null);
    setError(null);
    setAccuracyScore(null);
    setUploadPath(null);
    setProcessingTimeMs(null);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      setTranscribing(true);
      setError(null);
      
      // Step 1: Upload the audio file to Firebase Storage
      const filePath = await uploadAudioForTranscription(audioBlob);
      setUploadPath(filePath);
      
      // Step 2: Wait for the Firebase Extension to process the file
      // and store the results in Firestore
      const results = await listenForTranscriptionResults(filePath);
      
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
        Speech-to-Text API Live Testing
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component validates the Firebase Speech-to-Text Extension with real API calls.
        Record audio to test the actual transcription capabilities.
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
          ) : 'Transcribe Audio (Live API)'}
        </Button>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Processing info */}
      {uploadPath && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Audio uploaded to: {uploadPath}
          {processingTimeMs && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total processing time: {(processingTimeMs / 1000).toFixed(2)} seconds
            </Typography>
          )}
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
          </CardContent>
        </Card>
      )}
      
      {/* Sprint 0 validation info */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Sprint 0 Live Validation:</Typography>
        <Typography variant="body2">
          This component is using the actual Google Cloud Speech-to-Text API via the Firebase Extension.
          It demonstrates the end-to-end flow from audio recording to transcription results.
          The processing time metric helps validate that we can meet our 15-second target.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SpeechToTextLive;
