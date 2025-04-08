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
  Stack,
  Tabs,
  Tab
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
  setDoc,
  collectionGroup,
  Timestamp
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

const SpeechToTextWithDirect: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [collections, setCollections] = useState<string[]>([]);
  const [directMode, setDirectMode] = useState(false);

  useEffect(() => {
    // Scan for existing collections
    const scanCollections = async () => {
      try {
        addDebugMessage('Scanning for existing collections in Firestore...');
        
        // List of collections to check
        const collectionsToCheck = [
          'transcriptions',
          'speech_transcriptions',
          'speechToText',
          'stt_results',
          'audioTranscriptions',
          'transcription_results'
        ];
        
        const existingCollections: string[] = [];
        
        for (const collName of collectionsToCheck) {
          try {
            const collRef = collection(db, collName);
            const q = query(collRef, limit(1));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              existingCollections.push(collName);
              addDebugMessage(`Found existing collection: ${collName}`);
            }
          } catch (err) {
            console.error(`Error checking collection ${collName}:`, err);
          }
        }
        
        if (existingCollections.length === 0) {
          addDebugMessage('No relevant collections found. You may need to ensure the Firebase Extension is properly configured.');
        } else {
          setCollections(existingCollections);
        }
        
      } catch (err) {
        console.error('Error scanning collections:', err);
        addDebugMessage(`Error scanning collections: ${err}`);
      }
    };
    
    scanCollections();
  }, []);

  // Function to upload audio to Firebase Storage
  const uploadAudioForTranscription = async (blob: Blob): Promise<string> => {
    // Create a unique file name with timestamp for easier tracking
    const timestamp = new Date().getTime();
    const fileName = `speech_samples/test_${timestamp}.webm`;
    const storageRef = ref(storage, fileName);
    
    // Upload the blob
    addDebugMessage(`Uploading audio to ${fileName}...`);
    await uploadBytes(storageRef, blob);
    addDebugMessage(`Audio uploaded successfully to ${fileName}`);
    
    // Return the file path
    return fileName;
  };

  // Direct approach to trigger transcription - bypassing extension if needed
  const directTranscriptionTrigger = async (filePath: string): Promise<string> => {
    addDebugMessage('Using direct transcription trigger approach...');
    
    try {
      // Create a direct document in the collection the extension watches
      // This approach requires knowing the exact collection the extension is configured to watch
      const possibleCollections = collections.length > 0 ? collections : ['transcriptions'];
      const collName = possibleCollections[0];
      
      // Create a unique document ID
      const docId = `manual_${new Date().getTime()}`;
      
      // Create document with the file path and status
      await setDoc(doc(db, collName, docId), {
        audioPath: filePath,
        filePath: filePath, // Alternative field name
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      addDebugMessage(`Created document in ${collName} with ID: ${docId}`);
      return docId;
    } catch (err) {
      addDebugMessage(`Error in direct trigger: ${err}`);
      throw err;
    }
  };

  // Helper to add debug messages with local time
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString(); // This uses local timezone
    setDebugInfo(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`${timeString} - ${message}`);
  };

  // Function to check for transcription results in Firestore
  const listenForTranscriptionResults = async (filePath: string, directDocId?: string): Promise<TranscriptionResult> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      addDebugMessage(`Starting to listen for results for file: ${filePath}`);
      
      if (directDocId) {
        addDebugMessage(`Using direct document ID: ${directDocId}`);
      }
      
      // First, let's try to find existing collections in Firestore that might contain our transcription
      const checkExistingCollections = async () => {
        try {
          // Get all documents across multiple potential collections
          const possibleCollections = collections.length > 0 ? 
            collections : 
            [
              'transcriptions',
              'speech_transcriptions',
              'speechToText',
              'stt_results',
              'audioTranscriptions'
            ];
          
          const cleanFileName = filePath.split('/').pop()?.replace(/\./g, '_') || '';
          
          let found = false;

          // If we have a direct document ID, check that first
          if (directDocId && possibleCollections.length > 0) {
            const docRef = doc(db, possibleCollections[0], directDocId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              addDebugMessage(`Found direct document with ID: ${directDocId}`);
              found = true;
              
              // Set up listener on this specific document
              const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                  const data = docSnapshot.data();
                  addDebugMessage(`Document updated: ${JSON.stringify(data, null, 2)}`);
                  
                  if (data.status === 'completed' || data.transcript) {
                    unsubscribe();
                    const endTime = Date.now();
                    setProcessingTimeMs(endTime - startTime);
                    
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
                  }
                }
              });
              
              return; // Exit after setting up listener
            }
          }
          
          // Loop through possible collections
          for (const collName of possibleCollections) {
            addDebugMessage(`Checking collection: ${collName}`);
            
            // Try different document ID formats
            const potentialDocIds = [
              filePath,
              filePath.replace(/\//g, '_'),
              cleanFileName,
              `transcript_${cleanFileName}`
            ];
            
            for (const docId of potentialDocIds) {
              const docRef = doc(db, collName, docId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                addDebugMessage(`Found document in ${collName} with ID: ${docId}`);
                found = true;
                
                // Set up listener on this specific document
                const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
                  if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    addDebugMessage(`Document updated: ${JSON.stringify(data, null, 2)}`);
                    
                    if (data.status === 'completed' || data.transcript) {
                      unsubscribe();
                      const endTime = Date.now();
                      setProcessingTimeMs(endTime - startTime);
                      
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
                    }
                  }
                });
                
                return; // Exit after setting up listener
              }
            }
          }
          
          if (!found) {
            // Try a more aggressive query approach
            addDebugMessage('No direct document found, trying query listeners...');
            setUpQueryListener();
          }
        } catch (err) {
          addDebugMessage(`Error checking existing collections: ${err}`);
          // Fall back to query listener
          setUpQueryListener();
        }
      };
      
      // Set up a query listener to monitor for new documents
      const setUpQueryListener = () => {
        addDebugMessage('Setting up query listeners across multiple collections');
        
        const possibleCollections = collections.length > 0 ? 
          collections : 
          [
            'transcriptions',
            'speech_transcriptions',
            'speechToText',
            'stt_results'
          ];
        
        let listenerCount = 0;
        let activeListeners: (() => void)[] = [];
        
        // Also try listening to collection group queries
        addDebugMessage('Setting up collection group query listeners');
        
        const groupFieldNames = ['audioPath', 'filePath', 'path', 'input'];
        
        groupFieldNames.forEach(fieldName => {
          try {
            const q = query(
              collectionGroup(db, 'transcriptions'),
              where(fieldName, '==', filePath)
            );
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
              if (!snapshot.empty) {
                addDebugMessage(`Found matching document in collection group with field ${fieldName}`);
                snapshot.forEach(doc => {
                  const data = doc.data();
                  addDebugMessage(`Collection group document data: ${JSON.stringify(data, null, 2)}`);
                  
                  if (data.status === 'completed' || data.transcript) {
                    // Unsubscribe from all active listeners
                    activeListeners.forEach(unsub => unsub());
                    
                    const endTime = Date.now();
                    setProcessingTimeMs(endTime - startTime);
                    
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
                  }
                });
              }
            });
            
            activeListeners.push(unsubscribe);
            listenerCount++;
          } catch (err) {
            addDebugMessage(`Error setting up collection group query for ${fieldName}: ${err}`);
          }
        });
        
        for (const collName of possibleCollections) {
          const transcriptionsRef = collection(db, collName);
          
          // Try different field names for the audio path
          const fieldQueries = [
            'audioPath',
            'audio_path',
            'filePath', 
            'path',
            'input'
          ];
          
          fieldQueries.forEach(fieldName => {
            try {
              const q = query(
                transcriptionsRef, 
                where(fieldName, '==', filePath)
              );
              
              addDebugMessage(`Setting up listener on ${collName} where ${fieldName} = ${filePath}`);
              
              const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                  const doc = snapshot.docs[0];
                  const data = doc.data();
                  
                  addDebugMessage(`Found matching document in ${collName} with field ${fieldName}`);
                  addDebugMessage(`Document data: ${JSON.stringify(data, null, 2)}`);
                  
                  // Check if the transcription is complete
                  if (data.status === 'completed' || data.transcript) {
                    // Unsubscribe from all active listeners
                    activeListeners.forEach(unsub => unsub());
                    
                    const endTime = Date.now();
                    setProcessingTimeMs(endTime - startTime);
                    
                    // Parse and process the transcription data
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
                  }
                }
              });
              
              activeListeners.push(unsubscribe);
              listenerCount++;
            } catch (err) {
              addDebugMessage(`Error setting up query for ${collName}.${fieldName}: ${err}`);
            }
          });
        }
        
        addDebugMessage(`Set up ${listenerCount} query listeners`);
      };
      
      // Start by checking existing collections
      checkExistingCollections();
      
      // Set a timeout in case the transcription takes too long
      setTimeout(() => {
        addDebugMessage('Transcription timed out after 60 seconds');
        addDebugMessage('This means either:');
        addDebugMessage('1. The Firebase Extension is not properly configured');
        addDebugMessage('2. The Extension is not triggered by file uploads');
        addDebugMessage('3. The Extension is writing results to a different collection than we\'re listening to');
        addDebugMessage('4. There was an error in the transcription process');
        addDebugMessage('Check the Firebase console for more details');
        
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
      const filePath = await uploadAudioForTranscription(audioBlob);
      setUploadPath(filePath);
      
      let directDocId: string | undefined;
      
      // If direct mode is enabled, create a document directly
      if (directMode) {
        directDocId = await directTranscriptionTrigger(filePath);
      }
      
      // Step 2: Wait for the Firebase Extension to process the file
      // and store the results in Firestore
      addDebugMessage('Audio uploaded, waiting for transcription');
      const results = await listenForTranscriptionResults(filePath, directDocId);
      
      addDebugMessage('Transcription complete');
      setTranscriptionResults(results);
      
      // Calculate accuracy if reference text is provided
      if (referenceText.trim()) {
        const simpleAccuracy = calculateSimpleAccuracy(results.transcript, referenceText);
        setAccuracyScore(simpleAccuracy);
      }
      
    } catch (err) {
      console.error('Error transcribing audio:', err);
      addDebugMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Speech-to-Text API Live Testing (Direct Mode)
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component validates the Firebase Speech-to-Text Extension with real API calls.
        Record audio to test the actual transcription capabilities.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle1">
          Found Collections: {collections.length > 0 ? collections.join(', ') : 'None detected'}
        </Typography>
        <Typography variant="body2">
          These are the Firestore collections that might be used by the Speech-to-Text Extension.
        </Typography>
      </Alert>
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1">
            Direct Mode: 
          </Typography>
          <Chip 
            label={directMode ? "Enabled" : "Disabled"}
            color={directMode ? "success" : "default"}
            onClick={() => setDirectMode(!directMode)}
          />
          <Typography variant="body2" color="text.secondary">
            {directMode ? 
              "Will directly create documents to trigger transcription" : 
              "Will rely on the extension to detect file uploads"}
          </Typography>
        </Stack>
      </Paper>
      
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
          <Typography variant="body1">
            Audio uploaded to: {uploadPath}
          </Typography>
          {processingTimeMs && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total processing time: {(processingTimeMs / 1000).toFixed(2)} seconds
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Mode: {directMode ? "Direct document creation" : "Extension file monitoring"}
          </Typography>
        </Alert>
      )}
      
      {/* Debug info */}
      {debugInfo.length > 0 && (
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Debug Information ({debugInfo.length} entries)</Typography>
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
        <Typography variant="subtitle2">Sprint 0 Live Validation (Direct Mode):</Typography>
        <Typography variant="body2">
          This enhanced version includes a "Direct Mode" option that attempts to trigger the transcription 
          process by directly creating documents in Firestore. This can help work around issues where the
          Firebase Extension isn't detecting file uploads correctly.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SpeechToTextWithDirect;
