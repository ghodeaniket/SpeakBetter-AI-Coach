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
  Divider
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

const SpeechToTextEnhanced: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [collectionsFound, setCollectionsFound] = useState<string[]>([]);

  // Detect available collections on component mount
  useEffect(() => {
    const detectCollections = async () => {
      try {
        addDebugMessage('Scanning for available collections...');
        const collectionsToCheck = [
          'transcriptions',
          'speech_transcriptions',
          'speechToText',
          'stt_results'
        ];
        
        const foundCollections: string[] = [];
        
        for (const collName of collectionsToCheck) {
          try {
            const q = query(collection(db, collName), limit(1));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              foundCollections.push(collName);
              addDebugMessage(`Found collection: ${collName}`);
            }
          } catch (err) {
            // Skip errors for missing collections
          }
        }
        
        if (foundCollections.length > 0) {
          setCollectionsFound(foundCollections);
        } else {
          addDebugMessage('No relevant collections found, will use default "transcriptions"');
        }
      } catch (err) {
        addDebugMessage(`Error detecting collections: ${err}`);
      }
    };
    
    detectCollections();
  }, []);

  // Helper to add debug messages with local time
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setDebugLogs(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`[STT Debug] ${timeString} - ${message}`);
  };

  // Function to upload audio to Firebase Storage
  const uploadAudioForTranscription = async (blob: Blob): Promise<string> => {
    try {
      // Create a unique file name - use the speech_samples folder
      // since that appears to be configured in the extension
      const timestamp = new Date().getTime();
      const fileName = `speech_samples/audio_${timestamp}.webm`;
      const storageRef = ref(storage, fileName);
      
      addDebugMessage(`Uploading audio to ${fileName}...`);
      
      // Upload the blob
      await uploadBytes(storageRef, blob);
      
      // Get public URL for debugging
      const url = await getDownloadURL(storageRef);
      setAudioUrl(url);
      
      addDebugMessage(`✓ Audio uploaded successfully`);
      addDebugMessage(`Public URL: ${url}`);
      
      // Create a document to trigger the extension
      // Try with the primary collection from extension.yaml
      const collectionName = collectionsFound.length > 0 ? collectionsFound[0] : 'transcriptions';
      
      addDebugMessage(`Creating document in ${collectionName} collection to trigger extension...`);
      addDebugMessage(`Using file path: ${fileName}`);
      
      try {
        // Create a document with multiple field names that different extension versions might use
        const docRef = await addDoc(collection(db, collectionName), {
          audio_file: fileName,      // Common field name
          filepath: fileName,         // Alternative field name
          audioPath: fileName,        // Field name used in our code
          audio: {                    // Nested structure some extensions use
            uri: fileName
          },
          created_at: new Date().toISOString(), // ISO string instead of server timestamp
          status: 'pending'           // Common status field
        });
        
        addDebugMessage(`✓ Created document with ID: ${docRef.id}`);
      } catch (err) {
        addDebugMessage(`✖ Error creating document: ${err}`);
        
        // Try a direct document with a simpler structure as fallback
        try {
          const simplerId = `audio_${timestamp}`;
          await setDoc(doc(db, collectionName, simplerId), {
            filepath: fileName,
            created_at: new Date().toISOString()
          });
          
          addDebugMessage(`✓ Created simpler document with ID: ${simplerId}`);
        } catch (secondErr) {
          addDebugMessage(`✖ Error creating simpler document: ${secondErr}`);
          throw secondErr;
        }
      }
      
      return fileName;
    } catch (err) {
      const errorMessage = `Failed to upload audio: ${err}`;
      addDebugMessage(`✖ ${errorMessage}`);
      setError(errorMessage);
      throw err;
    }
  };

  // Function to check for transcription results in Firestore
  const listenForTranscriptionResults = async (filePath: string): Promise<TranscriptionResult> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      addDebugMessage(`Starting to listen for results for file: ${filePath}`);
      
      // Track all listeners for cleanup
      const listeners: (() => void)[] = [];
      
      // Collections to check based on what was found or defaults
      const collectionsToCheck = collectionsFound.length > 0 
        ? collectionsFound 
        : ['transcriptions', 'speech_transcriptions', 'speechToText'];
      
      // Field names that might contain our file path
      const fieldPaths = ['audio_file', 'filepath', 'audioPath', 'path', 'uri', 'audio.uri'];
      
      // Using collection group queries to search across all collections
      addDebugMessage('Setting up collection group queries...');
      
      fieldPaths.forEach(fieldPath => {
        try {
          // Set up a group query that will find the document regardless of collection
          const q = query(
            collectionGroup(db, 'transcriptions'), // This searches ALL collections named "transcriptions"
            where(fieldPath, '==', filePath)
          );
          
          addDebugMessage(`Listening on collection group where ${fieldPath} = ${filePath}`);
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              snapshot.docs.forEach(doc => {
                const data = doc.data();
                addDebugMessage(`Found document with ID: ${doc.id}`);
                addDebugMessage(`Document data: ${JSON.stringify(data).substring(0, 200)}...`);
                
                // Check for transcript in various field names
                const transcript = 
                  data.transcript || 
                  data.transcription || 
                  data.text || 
                  (data.results && data.results[0]?.alternatives[0]?.transcript) || 
                  '';
                
                if (transcript) {
                  // Clean up all listeners
                  listeners.forEach(unsub => unsub());
                  
                  const endTime = Date.now();
                  setProcessingTimeMs(endTime - startTime);
                  
                  // Create a transcription result
                  const filler_words = extractFillerWords(transcript);
                  
                  resolve({
                    transcript: transcript,
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
          }, error => {
            addDebugMessage(`Error in collection group query: ${error}`);
          });
          
          listeners.push(unsubscribe);
        } catch (err) {
          addDebugMessage(`Error setting up collection group query for ${fieldPath}: ${err}`);
        }
      });
      
      // Also set up direct collection queries as a backup
      collectionsToCheck.forEach(collName => {
        fieldPaths.forEach(fieldPath => {
          try {
            // Set up a direct collection query for this specific field
            const q = query(
              collection(db, collName),
              where(fieldPath, '==', filePath)
            );
            
            addDebugMessage(`Listening on ${collName} where ${fieldPath} = ${filePath}`);
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
              if (!snapshot.empty) {
                snapshot.docs.forEach(doc => {
                  const data = doc.data();
                  addDebugMessage(`Found document in ${collName} with ID: ${doc.id}`);
                  addDebugMessage(`Document data: ${JSON.stringify(data).substring(0, 200)}...`);
                  
                  // Check for transcript in various field names
                  const transcript = 
                    data.transcript || 
                    data.transcription || 
                    data.text || 
                    (data.results && data.results[0]?.alternatives[0]?.transcript) || 
                    '';
                  
                  if (transcript) {
                    // Clean up all listeners
                    listeners.forEach(unsub => unsub());
                    
                    const endTime = Date.now();
                    setProcessingTimeMs(endTime - startTime);
                    
                    // Create a transcription result
                    const filler_words = extractFillerWords(transcript);
                    
                    resolve({
                      transcript: transcript,
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
            }, error => {
              addDebugMessage(`Error in collection query: ${error}`);
            });
            
            listeners.push(unsubscribe);
          } catch (err) {
            addDebugMessage(`Error setting up query for ${collName}.${fieldPath}: ${err}`);
          }
        });
      });
      
      // Set up a timeout to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        addDebugMessage('⚠️ Transcription timed out after 30 seconds');
        
        // Additional debug information
        addDebugMessage('This could be due to:');
        addDebugMessage('1. Firebase Extension not properly configured');
        addDebugMessage('2. Extension not triggered by our document format');
        addDebugMessage('3. Extension writing results to a different collection/structure');
        addDebugMessage('4. Network issues or quota limitations');
        
        // Clean up all listeners
        listeners.forEach(unsub => unsub());
        
        reject(new Error('Transcription timed out after 30 seconds'));
      }, 30000);
      
      // Add timeout cleanup to listeners
      listeners.push(() => clearTimeout(timeoutId));
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
    setAudioUrl(null);
    setProcessingTimeMs(null);
    setDebugLogs([]);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      setTranscribing(true);
      setError(null);
      setDebugLogs([]);
      
      addDebugMessage('Starting transcription process...');
      
      // Step 1: Upload the audio file to Firebase Storage
      const filePath = await uploadAudioForTranscription(audioBlob);
      setUploadPath(filePath);
      
      // Step 2: Wait for the Firebase Extension to process the file
      addDebugMessage('Waiting for transcription results...');
      
      try {
        const results = await listenForTranscriptionResults(filePath);
        
        addDebugMessage('✅ Transcription completed successfully!');
        setTranscriptionResults(results);
        
        // Calculate accuracy if reference text is provided
        if (referenceText.trim()) {
          const simpleAccuracy = calculateSimpleAccuracy(results.transcript, referenceText);
          setAccuracyScore(simpleAccuracy);
          addDebugMessage(`Calculated accuracy score: ${simpleAccuracy}%`);
        }
      } catch (transcriptionErr) {
        addDebugMessage(`⚠️ Transcription process failed: ${transcriptionErr.message}`);
        setError(`Transcription failed: ${transcriptionErr.message}`);
        
        // Try to check Firebase Extension configuration directly in Storage
        addDebugMessage('Checking Firebase Extensions configuration...');
        try {
          // Attempt to create a document with the exact format described in the Firebase Extension docs
          const extensionCollName = 'transcriptions'; // This should match extension config
          const directDocId = `direct_${Date.now()}`;
          
          addDebugMessage('Creating a direct trigger document with standard format...');
          await setDoc(doc(db, extensionCollName, directDocId), {
            audio: {
              uri: `gs://speakbetter-dev-722cc.firebasestorage.app/${filePath}`
            },
            timestamp: new Date().toISOString()
          });
          
          addDebugMessage(`Direct trigger document created with ID: ${directDocId}`);
          addDebugMessage('If the extension is properly configured, this should trigger transcription.');
          addDebugMessage('Check Firebase Console -> Storage -> Logs to see if the extension is running.');
        } catch (extErr) {
          addDebugMessage(`Failed to create direct trigger: ${extErr}`);
        }
        
        // Run diagnostics to help debug
        addDebugMessage('Running diagnostics...');
        try {
          const collections = collectionsFound.length > 0 ? collectionsFound : ['transcriptions']; 
          
          for (const collName of collections) {
            const recentDocs = await getDocs(query(collection(db, collName), limit(3)));
            
            if (!recentDocs.empty) {
              addDebugMessage(`Found ${recentDocs.size} recent documents in ${collName}`);
              
              recentDocs.docs.forEach((doc, idx) => {
                const data = doc.data();
                addDebugMessage(`Document ${idx+1}: ${JSON.stringify(data).substring(0, 200)}...`);
              });
            } else {
              addDebugMessage(`No documents found in ${collName}`);
            }
          }
        } catch (diagErr) {
          addDebugMessage(`Diagnostics error: ${diagErr}`);
        }
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      addDebugMessage(`⚠️ Error: ${err instanceof Error ? err.message : String(err)}`);
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
        Speech-to-Text API Enhanced Test
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component provides a robust implementation for testing the Firebase Speech-to-Text 
        Extension with improved compatibility and detailed debugging.
      </Typography>
      
      {collectionsFound.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Found collections:</strong> {collectionsFound.join(', ')}
          </Typography>
        </Alert>
      )}
      
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
          ) : 'Transcribe Audio (Enhanced)'}
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
            Audio uploaded as: {uploadPath}
          </Typography>
          {audioUrl && (
            <Typography variant="body2" component="div" sx={{ mt: 1, wordBreak: 'break-all' }}>
              URL: {audioUrl}
            </Typography>
          )}
          {processingTimeMs && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total processing time: {(processingTimeMs / 1000).toFixed(2)} seconds
            </Typography>
          )}
        </Alert>
      )}
      
      {/* Debug logs */}
      {debugLogs.length > 0 && (
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Debug Logs ({debugLogs.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                maxHeight: '300px',
                overflow: 'auto',
                bgcolor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}
            >
              {debugLogs.map((log, idx) => (
                <Typography key={idx} variant="body2" component="div" sx={{ mb: 0.5 }}>
                  {log}
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
      
      {/* Implementation notes */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Enhanced Implementation Notes:</Typography>
        <Typography variant="body2">
          This enhanced version includes several improvements to work around common issues with Firebase Extensions:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Uses multiple field names for compatibility with different extension versions</li>
          <li>Implements collection group queries to find results anywhere in the database</li>
          <li>Provides detailed logging to diagnose and troubleshoot issues</li>
          <li>Tries both direct collection queries and collection group queries</li>
          <li>Supports multiple document structures that extensions might create</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default SpeechToTextEnhanced;