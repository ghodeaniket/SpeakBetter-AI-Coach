import React, { useState, useEffect } from 'react';
import {
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { storage, db, functions } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  setDoc,
  doc,
  getDocs,
  query,
  limit,
  collectionGroup,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const SpeechToTextTroubleshooter: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [customGSPath, setCustomGSPath] = useState('');

  // Helper to add logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp} - ${message}`]);
    console.log(`[Troubleshooter] ${timestamp} - ${message}`);
  };

  // Check storage structure
  const checkStorageStructure = async () => {
    setLoading(true);
    addLog('Checking Firebase Storage structure...');
    
    try {
      // Check the root directory
      const rootRef = ref(storage);
      const rootList = await listAll(rootRef);
      
      addLog(`Found ${rootList.prefixes.length} folders at root level`);
      rootList.prefixes.forEach(folder => {
        addLog(`Folder: ${folder.name}`);
      });
      
      addLog(`Found ${rootList.items.length} files at root level`);
      
      // Check if speech_samples directory exists
      const hasSpeechSamples = rootList.prefixes.some(folder => folder.name === 'speech_samples');
      
      if (hasSpeechSamples) {
        addLog('✓ Found speech_samples directory');
        
        // Check contents of speech_samples
        const speechSamplesRef = ref(storage, 'speech_samples');
        const speechSamplesList = await listAll(speechSamplesRef);
        
        addLog(`Found ${speechSamplesList.items.length} files in speech_samples directory`);
        
        // List a few sample files
        speechSamplesList.items.slice(0, 5).forEach(item => {
          addLog(`File: ${item.name}`);
        });
      } else {
        addLog('⚠️ speech_samples directory not found');
      }
    } catch (err) {
      addLog(`Error checking storage: ${err}`);
    }
    
    setLoading(false);
  };

  // Check Firestore structure
  const checkFirestoreStructure = async () => {
    setLoading(true);
    addLog('Checking Firestore structure...');
    
    try {
      // Check the collections in the database
      const collectionsToCheck = [
        'transcriptions',
        'speech_transcriptions',
        'speechToText',
        'stt_results',
        'speech-to-text-results',
        'results'
      ];
      
      for (const collName of collectionsToCheck) {
        try {
          const q = query(collection(db, collName), limit(3));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            addLog(`✓ Found collection: ${collName} with ${snapshot.size} documents`);
            
            // Log a sample document
            snapshot.docs.slice(0, 1).forEach(doc => {
              const data = doc.data();
              addLog(`Sample document: ${JSON.stringify(data).substring(0, 200)}...`);
            });
          } else {
            addLog(`Collection ${collName} exists but has no documents`);
          }
        } catch (err) {
          addLog(`Collection ${collName} not found or access error`);
        }
      }
      
      // Try to check collection groups for nested transcriptions
      try {
        const groupSnapshot = await getDocs(query(collectionGroup(db, 'transcriptions'), limit(3)));
        
        if (!groupSnapshot.empty) {
          addLog(`✓ Found ${groupSnapshot.size} documents in 'transcriptions' collection group`);
          
          // Log paths
          groupSnapshot.docs.forEach(doc => {
            addLog(`Document path: ${doc.ref.path}`);
          });
        } else {
          addLog('No documents found in collection group \'transcriptions\'');
        }
      } catch (err) {
        addLog(`Error checking collection groups: ${err}`);
      }
    } catch (err) {
      addLog(`Error checking Firestore: ${err}`);
    }
    
    setLoading(false);
  };

  // Test extension with a direct trigger document
  const testDirectTrigger = async () => {
    setLoading(true);
    addLog('Testing extension with direct trigger...');
    
    try {
      // Upload a test audio file
      const testAudioPath = 'speech_samples/test_audio.webm';
      
      // Create one document with standard Google extension format
      const extensionDocRef = await addDoc(collection(db, 'transcriptions'), {
        audio: {
          uri: `gs://speakbetter-dev-722cc.firebasestorage.app/${testAudioPath}`
        },
        timestamp: serverTimestamp()
      });
      
      addLog(`✓ Created extension trigger document with ID: ${extensionDocRef.id}`);
      addLog('Extension should process this document according to standard format');
      
      // Create another with alternative format
      const altDocRef = await addDoc(collection(db, 'transcriptions'), {
        audioPath: testAudioPath,
        filepath: testAudioPath,
        created_at: new Date().toISOString()
      });
      
      addLog(`✓ Created alternative format document with ID: ${altDocRef.id}`);
      addLog('Extension might process this document depending on configuration');
      
    } catch (err) {
      addLog(`Error creating test documents: ${err}`);
    }
    
    setLoading(false);
  };

  // Test with custom GS path
  const testCustomGSPath = async () => {
    if (!customGSPath) {
      addLog('⚠️ Please enter a GS path first');
      return;
    }
    
    setLoading(true);
    addLog(`Testing with custom GS path: ${customGSPath}`);
    
    try {
      // Create document with the custom GS path
      const docRef = await addDoc(collection(db, 'transcriptions'), {
        audio: {
          uri: customGSPath
        },
        timestamp: serverTimestamp()
      });
      
      addLog(`✓ Created document with custom GS path, ID: ${docRef.id}`);
      addLog('Waiting for extension to process...');
      
      // Wait a moment and then check for results
      setTimeout(async () => {
        try {
          const resultQuery = query(
            collection(db, 'transcriptions'),
            where('audio.uri', '==', customGSPath),
            limit(1)
          );
          
          const resultSnapshot = await getDocs(resultQuery);
          
          if (!resultSnapshot.empty) {
            const resultDoc = resultSnapshot.docs[0];
            const resultData = resultDoc.data();
            
            addLog(`Found result document: ${JSON.stringify(resultData).substring(0, 300)}...`);
            
            if (resultData.transcript || resultData.transcription || resultData.results) {
              addLog('✅ Success! The extension has processed the audio file');
            } else {
              addLog('⚠️ Document found but no transcription results yet');
            }
          } else {
            addLog('⚠️ No results found yet. Extension might still be processing');
          }
        } catch (err) {
          addLog(`Error checking for results: ${err}`);
        }
        
        setLoading(false);
      }, 5000);
      
    } catch (err) {
      addLog(`Error testing custom GS path: ${err}`);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Speech-to-Text Extension Troubleshooter
      </Typography>
      
      <Typography variant="body1" paragraph>
        This tool helps diagnose issues with the Firebase Speech-to-Text Extension configuration.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          The tool will check your Firebase project for proper Speech-to-Text Extension setup.
        </Typography>
      </Alert>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Firebase Storage Check
        </Typography>
        
        <Typography variant="body2" paragraph>
          This will check your Firebase Storage structure to ensure files are being uploaded correctly.
        </Typography>
        
        <Button 
          variant="outlined" 
          onClick={checkStorageStructure}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Check Storage Structure
        </Button>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Firestore Structure Check
        </Typography>
        
        <Typography variant="body2" paragraph>
          This will check your Firestore database structure for expected collections and documents.
        </Typography>
        
        <Button 
          variant="outlined" 
          onClick={checkFirestoreStructure}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Check Firestore Structure
        </Button>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Direct Extension Trigger Test
        </Typography>
        
        <Typography variant="body2" paragraph>
          This will create documents directly in Firestore to trigger the extension with standard formats.
        </Typography>
        
        <Button 
          variant="outlined" 
          onClick={testDirectTrigger}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Test Direct Trigger
        </Button>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom GS Path Test
        </Typography>
        
        <Typography variant="body2" paragraph>
          Test with a specific GS path that you know exists in your Firebase Storage.
        </Typography>
        
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
          <InputLabel htmlFor="gs-path-input">GS Path</InputLabel>
          <OutlinedInput
            id="gs-path-input"
            value={customGSPath}
            onChange={(e) => setCustomGSPath(e.target.value)}
            label="GS Path"
            placeholder="gs://speakbetter-dev-722cc.firebasestorage.app/speech_samples/example.webm"
          />
          <FormHelperText>Enter the full GS path to an existing audio file</FormHelperText>
        </FormControl>
        
        <Button 
          variant="outlined" 
          onClick={testCustomGSPath}
          disabled={loading || !customGSPath}
          sx={{ mb: 2 }}
        >
          Test Custom GS Path
        </Button>
      </Paper>
      
      {/* Logs Display */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Troubleshooting Logs</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loading && (
            <Box display="flex" alignItems="center" mb={2}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Operation in progress...</Typography>
            </Box>
          )}
          
          <Box
            sx={{
              maxHeight: '400px',
              overflow: 'auto',
              bgcolor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}
          >
            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No logs yet. Run a check to see results here.
              </Typography>
            ) : (
              logs.map((log, idx) => (
                <Typography key={idx} variant="body2" component="div" sx={{ mb: 0.5 }}>
                  {log}
                </Typography>
              ))
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Extension Configuration Info:</Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Firebase Extensions are configured in the Firebase Console</li>
          <li>Check your Speech-to-Text Extension for the correct collection name</li>
          <li>Make sure the extension has permission to access your Storage files</li>
          <li>Verify that the extension is watching the correct path in Storage</li>
          <li>Check the Firebase Functions logs for any extension-related errors</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default SpeechToTextTroubleshooter;