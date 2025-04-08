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
  getDocs,
  getDoc,
  collectionGroup
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

const SpeechToTextLiveFixed: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Function to upload audio to Firebase Storage and create the related documents
  const uploadAudioForTranscription = async (blob: Blob): Promise<string> => {
    try {
      // Create a unique file name - use a simple name format that the extension can handle better
      const timestamp = Date.now();
      const fileName = `test_${timestamp}.webm`;
      const filePath = `speech_samples/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      // Upload the blob
      addDebugMessage(`Uploading audio to ${filePath}...`);
      await uploadBytes(storageRef, blob);
      addDebugMessage(`Audio uploaded successfully to ${filePath}`);
      
      // Use a simple format for the extension without serverTimestamp
      addDebugMessage(`Trying simple extension format...`);
      
      try {
        // Simple format that should work with most STT extensions
        const docRef = await addDoc(collection(db, 'transcriptions'), {
          audio_file: filePath,
          created_at: new Date().toISOString() // Use string timestamp instead
        });
        
        addDebugMessage(`✓ Created document with ID: ${docRef.id}`);
      } catch (err) {
        const errorMessage = `Failed to create document: ${err}`;
        addDebugMessage(`✖ ${errorMessage}`);
        console.error(errorMessage, err);
        setError(errorMessage);
        
        // Check Firestore permissions
        addDebugMessage("Checking Firestore access permissions...");
        try {
          const testRef = await addDoc(collection(db, 'test_collection'), {
            test: true,
            timestamp: new Date().toISOString()
          });
          
          addDebugMessage(`✓ Test collection write successful: ${testRef.id}`);
        } catch (permErr) {
          addDebugMessage(`✖ Firestore permissions issue: ${permErr}`);
          setError(`Firestore permission error. Check your Firebase project configuration.`);
        }
      }
      
      // Return the file path
      return filePath;
    } catch (err) {
      const errorMsg = `Error in upload process: ${err}`;
      addDebugMessage(`⚠️ ${errorMsg}`);
      setError(errorMsg);
      throw err;
    }
  };

  // Helper to add debug messages
  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `${timestamp} - ${message}`]);
    console.log(message);
  };

  // Function to check for transcription results in Firestore
  const listenForTranscriptionResults = async (filePath: string): Promise<TranscriptionResult> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      addDebugMessage(`Starting to listen for results for file: ${filePath}`);
      
      // Extract just the filename without the path, as the extension might store it differently
      const filename = filePath.split('/').pop() || '';
      
      // Set up listeners across different collections and query methods
      let unsubscribes: (() => void)[] = [];
      
      // First try a collection group query - this searches across ALL collections
      try {
        addDebugMessage('Setting up collection group query listeners');
        
        // Function to create a query and listen for transcription results
        const setupCollectionGroupQuery = (fieldName: string, value: string) => {
          try {
            const q = query(
              collectionGroup(db, 'transcriptions'),
              where(fieldName, '==', value)
            );
            
            addDebugMessage(`Setting up collectionGroup query: ${fieldName}=${value}`);
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
              if (!snapshot.empty) {
                addDebugMessage(`🎯 Found result with collectionGroup: ${fieldName}=${value}`);
                snapshot.docs.forEach((doc, idx) => {
                  const data = doc.data();
                  addDebugMessage(`Result ${idx+1}: ${JSON.stringify(data).substring(0, 150)}...`);
                  
                  // Check if it has transcript data
                  if (data.transcript || data.transcription || data.results) {
                    addDebugMessage(`✅ Found transcript data!`);
                    
                    // Extract transcript - different formats might store it differently
                    const transcript = data.transcript || 
                      data.transcription || 
                      (data.results && data.results[0]?.alternatives[0]?.transcript) || 
                      "";
                    
                    // Clean up all listeners
                    unsubscribes.forEach(unsub => unsub());
                    
                    // Calculate processing time
                    const endTime = Date.now();
                    setProcessingTimeMs(endTime - startTime);
                    
                    // Process and return results
                    const filler_words = extractFillerWords(transcript);
                    resolve({
                      transcript: transcript,
                      confidence: 0.9, // Default if not available
                      fillerWords: {
                        count: filler_words.length,
                        words: filler_words.map(w => ({
                          word: w.word,
                          timestamp: w.timestamp
                        }))
                      }
                    });
                  }
                });
              }
            });
            
            unsubscribes.push(unsubscribe);
          } catch (err) {
            addDebugMessage(`Error setting up collection group query for ${fieldName}: ${err}`);
          }
        };
        
        // Try different field names with both full path and just filename
        const fields = ['audio_file', 'filepath', 'path', 'uri'];
        const values = [filePath, filename, `gs://speakbetter-dev-722cc.firebasestorage.app/${filePath}`];
        
        fields.forEach(field => {
          values.forEach(value => {
            setupCollectionGroupQuery(field, value);
          });
        });
        
        // For 'audio.uri' nested field, special handling
        try {
          const q = query(
            collectionGroup(db, 'transcriptions'),
            where('audio.uri', '==', `gs://speakbetter-dev-722cc.firebasestorage.app/${filePath}`)
          );
          
          addDebugMessage(`Setting up collectionGroup query for nested field: audio.uri`);
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              addDebugMessage(`🎯 Found result with audio.uri query`);
              // Handle match similar to above
            }
          });
          
          unsubscribes.push(unsubscribe);
        } catch (err) {
          addDebugMessage(`Error setting up collection group query for audio.uri: ${err}`);
        }
      } catch (err) {
        addDebugMessage(`Error setting up collection group queries: ${err}`);
      }
      
      // Set a timeout to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        addDebugMessage('⚠️ Transcription timeout after 30 seconds');
        addDebugMessage('No relevant collections found. You may need to ensure the Firebase Extension is properly configured.');
        
        // Clean up listeners
        unsubscribes.forEach(unsub => unsub());
        
        reject(new Error('Transcription timed out. The Firebase Extension may not be properly configured or working.'));
      }, 30000);
      
      // Add the timeout cleanup to unsubscribes
      unsubscribes.push(() => clearTimeout(timeoutId));
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
    setDebugInfo([]);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      setTranscribing(true);
      setError(null);
      setDebugInfo([]);
      
      // Step 1: Upload the audio file to Firebase Storage
      addDebugMessage('Starting audio upload');
      let filePath;
      try {
        filePath = await uploadAudioForTranscription(audioBlob);
        setUploadPath(filePath);
      } catch (uploadError) {
        addDebugMessage(`⚠️ Upload process failed: ${uploadError}`);
        setError(`Upload or document creation failed: ${uploadError}`);
        setTranscribing(false);
        return; // Stop the process if upload fails
      }
      
      // Step 2: Wait for the Firebase Extension to process the file
      addDebugMessage('Audio uploaded, waiting for transcription');
      
      try {
        const results = await listenForTranscriptionResults(filePath);
        
        addDebugMessage('✅ Transcription complete');
        setTranscriptionResults(results);
        
        // Calculate accuracy if reference text is provided
        if (referenceText.trim()) {
          const simpleAccuracy = calculateSimpleAccuracy(results.transcript, referenceText);
          setAccuracyScore(simpleAccuracy);
        }
      } catch (transcriptionError) {
        console.error('Error during transcription:', transcriptionError);
        addDebugMessage(`⚠️ Transcription failed: ${transcriptionError.message}`);
        setError(`Transcription process failed: ${transcriptionError.message}`);
        
        // Additional diagnostics to help debug
        addDebugMessage('Running diagnostics...');
        try {
          // Check if we can query the document directly
          const diagResults = await getDocs(collection(db, 'transcriptions'));
          addDebugMessage(`Found ${diagResults.size} transcription documents in total`);
          
          // Log some recent documents for debugging
          diagResults.docs.slice(-3).forEach((doc, idx) => {
            const data = doc.data();
            addDebugMessage(`Recent document ${idx+1}: ID=${doc.id}, Data=${JSON.stringify(data).substring(0, 150)}...`);
          });
        } catch (diagError) {
          addDebugMessage(`Diagnostics failed: ${diagError.message}`);
        }
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      addDebugMessage(`⚠️ Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
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
        Speech-to-Text API Live Testing (Fixed)
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
      
      {/* Debug info */}
      {debugInfo.length > 0 && (
        <Accordion sx={{ mb: 3 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Debug Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: '300px', overflow: 'auto', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              {debugInfo.map((msg, idx) => (
                <Typography key={idx} variant="body2" fontFamily="monospace" fontSize="0.85rem">
                  {msg}
                </Typography>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
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
        <Typography variant="subtitle2">Sprint 0 Live Validation (Fixed):</Typography>
        <Typography variant="body2">
          This is an enhanced version with better debugging and more flexible collection detection.
          It attempts to find your transcription results by checking multiple collections and document structures
          that Firebase Extensions might create.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SpeechToTextLiveFixed;