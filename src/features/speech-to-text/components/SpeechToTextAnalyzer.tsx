import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Container,
  Breadcrumbs,
  Link,
  Tabs,
  Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import MicIcon from '@mui/icons-material/Mic';
import SaveIcon from '@mui/icons-material/Save';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AudioRecorder from '../../../shared/components/AudioRecorder';
import DebugLog from '../../../shared/components/DebugLog';
import OfflineIndicator from '../../../shared/components/OfflineIndicator';
import { useSpeech } from '../../../shared/contexts/SpeechContext';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useSessionManagement } from '../../session-management/hooks/useSessionManagement';
import { 
  processAudio, 
  calculateAccuracy, 
  getFillerWordPercentage,
  processAudioOffline // New offline processing function
} from '../services/speechToTextService';
import { formatSeconds } from '../../../shared/utils/formatters';
import { TranscriptionResult } from '../../../services/google-cloud/speech';
import { 
  getGuidedReadingContentById,
  getQAQuestionById 
} from '../../practice-modes/services/practiceContentService';
import useOfflineDetection from '../../../shared/hooks/useOfflineDetection';
import useIndexedDB from '../../../shared/hooks/useIndexedDB';
import { syncDbConfig } from '../../../services/sync/syncService';
import { getSessionDBConfig } from '../../session-management/services/sessionService';

// Full IndexedDB config combining sync and session configs
const dbConfig = {
  name: 'speakbetter-app-db',
  version: 1,
  stores: {
    ...syncDbConfig.stores,
    ...getSessionDBConfig()
  }
};

const SpeechToTextAnalyzer: React.FC = () => {
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('sessionId');
  const practiceType = queryParams.get('type') as 'freestyle' | 'guided' | 'qa' || 'freestyle';
  const contentId = queryParams.get('contentId');
  
  // Auth hook
  const { userProfile } = useAuth();
  
  // Access speech context for storing global state
  const { state, dispatch } = useSpeech();
  
  // Offline detection hook
  const { isOnline, isOffline } = useOfflineDetection();
  
  // IndexedDB hook for offline data storage
  const dbAccess = useIndexedDB<any>(dbConfig);
  
  // Session management hook with offline support
  const { 
    currentSession, 
    loadSession, 
    updateSessionData, 
    uploadRecording, 
    isLoading: sessionLoading,
    error: sessionError
  } = useSessionManagement({ 
    userId: userProfile?.uid || null,
    dbAccess: dbAccess,
    isOffline
  });
  
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
  const [sessionSaved, setSessionSaved] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [practiceContent, setPracticeContent] = useState<any | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>(isOnline ? 'online' : 'offline');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Track network status changes
  useEffect(() => {
    setNetworkStatus(isOnline ? 'online' : 'offline');
    if (isOffline) {
      addDebugMessage('Network is offline. Some features may be limited.');
    } else if (isOnline && networkStatus === 'offline') {
      addDebugMessage('Network is back online. Full functionality restored.');
    }
  }, [isOnline, isOffline, networkStatus]);
  
  // Load content if contentId is provided
  useEffect(() => {
    if (contentId && (practiceType === 'guided' || practiceType === 'qa')) {
      setContentLoading(true);
      
      const loadContent = async () => {
        try {
          // First, try to load from IndexedDB if offline
          if (isOffline && !dbAccess.isLoading && dbAccess.db) {
            addDebugMessage('Attempting to load content from offline storage...');
            try {
              const cachedContent = await dbAccess.getById(
                practiceType === 'guided' ? 'guidedContent' : 'qaContent', 
                contentId
              );
              
              if (cachedContent) {
                setPracticeContent(cachedContent);
                if (practiceType === 'guided') {
                  setReferenceText(cachedContent.text);
                }
                addDebugMessage(`Loaded ${practiceType} content from offline storage: ${cachedContent?.title || cachedContent?.question}`);
                setContentLoading(false);
                return;
              } else {
                addDebugMessage('Content not found in offline storage.');
              }
            } catch (dbError) {
              console.warn('Error accessing IndexedDB:', dbError);
            }
          }
          
          // If online or not in IndexedDB, try from server
          if (!isOffline || !dbAccess.db) {
            let content = null;
            
            if (practiceType === 'guided') {
              content = await getGuidedReadingContentById(contentId);
              if (content) {
                // Set reference text for guided reading
                setReferenceText(content.text);
                
                // Store in IndexedDB for offline use if we have access
                if (dbAccess.db) {
                  try {
                    await dbAccess.update('guidedContent', content);
                    addDebugMessage('Stored guided content in offline storage.');
                  } catch (dbError) {
                    console.warn('Could not store guided content in IndexedDB:', dbError);
                  }
                }
              }
            } else if (practiceType === 'qa') {
              content = await getQAQuestionById(contentId);
              
              // Store in IndexedDB for offline use if we have access
              if (content && dbAccess.db) {
                try {
                  await dbAccess.update('qaContent', content);
                  addDebugMessage('Stored Q&A content in offline storage.');
                } catch (dbError) {
                  console.warn('Could not store Q&A content in IndexedDB:', dbError);
                }
              }
            }
            
            setPracticeContent(content);
            addDebugMessage(`${practiceType} content loaded: ${content?.title || content?.question}`);
          } else {
            setError('You are offline and this content is not available offline.');
            addDebugMessage('ERROR: Cannot load content while offline');
          }
        } catch (err: any) {
          console.error('Error loading content:', err);
          setError(`Error loading content: ${err.message || 'Unknown error'}`);
          addDebugMessage(`ERROR loading content: ${err.message || 'Unknown error'}`);
        } finally {
          setContentLoading(false);
        }
      };
      
      loadContent();
    }
  }, [contentId, practiceType, isOffline, dbAccess]);
  
  // Load session data if sessionId is provided
  useEffect(() => {
    if (sessionId && userProfile?.uid) {
      loadSession(sessionId).catch(err => {
        console.error('Error loading session:', err);
        setError('Error loading session: ' + err.message);
      });
    }
  }, [sessionId, userProfile?.uid, loadSession]);

  // Add debug message
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setDebugLogs(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`${timeString} - ${message}`);
  };

  // Handle audio captured
  const handleAudioCaptured = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setDurationSeconds(duration);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setSessionSaved(false);
    addDebugMessage(`Audio recorded: ${(blob.size / 1024).toFixed(2)} KB, Duration: ${duration.toFixed(1)}s`);
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

      // If we have a session, update its status to processing
      if (sessionId) {
        await updateSessionData(sessionId, { status: 'processing' }, {
          dbAccess,
          isOffline,
          userId: userProfile?.uid || undefined
        });
      }

      let result;
      
      // Use offline processing when offline
      if (isOffline) {
        addDebugMessage('Using offline speech processing...');
        result = await processAudioOffline(audioBlob);
      } else {
        // Online processing
        result = await processAudio(audioBlob, {
          uploadToStorage: true,
          languageCode: 'en-US'
        });
      }

      addDebugMessage(`Transcription ${isOffline ? '(offline)' : ''} successful: "${result.transcriptionResult.transcript}"`);
      
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
      
      // Store results in speech context for feedback generation
      dispatch({ type: 'SET_TRANSCRIPTION_RESULT', payload: result.transcriptionResult });
      dispatch({ type: 'SET_AUDIO_URL', payload: result.audioUrl || audioUrl });
      
      // If we have a session, update it with the analysis results
      if (sessionId) {
        const updateData: any = { 
          status: 'completed',
          hasAnalysis: true,
          title: result.transcriptionResult.transcript.slice(0, 30) + (result.transcriptionResult.transcript.length > 30 ? '...' : ''),
          metrics: {
            wordsPerMinute: result.wordsPerMinute || 0,
            fillerWordCount: result.transcriptionResult.fillerWords?.count || 0,
            fillerWordPercentage: getFillerWordPercentage(result.transcriptionResult),
            clarityScore: result.clarityScore || 0
          }
        };
        
        // Add practice-specific data
        if (practiceType === 'guided' && referenceText) {
          // For guided reading, add reference text and accuracy score
          updateData.referenceText = referenceText;
          
          if (accuracyScore !== null) {
            updateData.metrics.accuracyScore = accuracyScore;
          }
        } else if (practiceType === 'qa' && practiceContent) {
          // For Q&A, add the question
          updateData.question = practiceContent.question;
          
          // Add structure score calculation (simplified example)
          // In a real implementation, you would have a more sophisticated
          // algorithm to evaluate response structure
          const wordCount = result.transcriptionResult.wordTimeOffsets?.length || 0;
          const structureScore = wordCount > 100 ? 85 : wordCount > 50 ? 70 : 50;
          updateData.metrics.structureScore = structureScore;
        }
        
        await updateSessionData(sessionId, updateData, {
          dbAccess,
          isOffline,
          userId: userProfile?.uid || undefined
        });
        
        // Store analysis in IndexedDB for offline access
        if (dbAccess.db) {
          try {
            const analysisData = {
              id: sessionId,
              userId: userProfile?.uid,
              transcriptionResult: result.transcriptionResult,
              wordsPerMinute: result.wordsPerMinute,
              clarityScore: result.clarityScore,
              accuracyScore: accuracyScore,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await dbAccess.update('speechAnalysis', analysisData);
            addDebugMessage('Stored analysis results in offline storage.');
          } catch (dbError) {
            console.warn('Could not store analysis in IndexedDB:', dbError);
          }
        }
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(`Error transcribing audio: ${err.message || 'Unknown error'}`);
      addDebugMessage(`ERROR: ${err.message || 'Unknown error'}`);
      
      // If we have a session, update its status to error
      if (sessionId) {
        await updateSessionData(sessionId, { status: 'error' }, {
          dbAccess,
          isOffline,
          userId: userProfile?.uid || undefined
        });
      }
    } finally {
      setTranscribing(false);
    }
  };
  
  // Save the recording to the session
  const handleSaveToSession = async () => {
    if (!audioBlob || !sessionId || !userProfile?.uid) {
      setError('Cannot save: Missing audio recording, session, or user authentication');
      return;
    }
    
    try {
      setError(null);
      addDebugMessage(`Saving recording to session${isOffline ? ' (offline mode)' : ''}...`);
      
      // Upload the recording to the session with offline support
      await uploadRecording(sessionId, audioBlob, durationSeconds, {
        dbAccess,
        isOffline
      });
      
      setSessionSaved(true);
      addDebugMessage('Recording saved to session successfully');
      
      if (isOffline) {
        addDebugMessage('Note: Recording will be synced to server when you are back online');
      }
    } catch (err: any) {
      console.error('Error saving to session:', err);
      setError(`Error saving to session: ${err.message || 'Unknown error'}`);
      addDebugMessage(`ERROR saving to session: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Return to dashboard
  const handleReturnToDashboard = () => {
    // If we have analysis results, set state to show success message
    if (transcriptionResults) {
      navigate('/', { state: { fromSession: true } });
    } else {
      navigate('/');
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
        {/* Offline Indicator */}
        <OfflineIndicator 
          showPersistentIndicator={true} 
          onStatusChange={(isOnline) => {
            if (isOnline && networkStatus === 'offline') {
              addDebugMessage('Network is back online. Full functionality restored.');
            }
          }}
        />
        
        {/* Breadcrumb navigation */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={handleReturnToDashboard}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <MicIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Speech Analysis
          </Typography>
        </Breadcrumbs>
      
        <Typography variant="h4" gutterBottom>
          Speech Analysis
          {currentSession && (
            <Chip 
              label={currentSession.type === 'freestyle' ? 'Freestyle Practice' : 
                    currentSession.type === 'guided' ? 'Guided Reading' : 'Q&A Simulation'} 
              color="primary" 
              size="small" 
              sx={{ ml: 2, verticalAlign: 'middle' }} 
              icon={currentSession.type === 'freestyle' ? <MicIcon /> : 
                   currentSession.type === 'guided' ? <MenuBookIcon /> : <QuestionAnswerIcon />}
            />
          )}
        </Typography>
        
        {/* Offline mode notice */}
        {isOffline && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Offline Mode</AlertTitle>
            You're currently working offline. Your recordings and analysis will be saved locally 
            and synchronized when you're back online.
            {isOffline && practiceType !== 'freestyle' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Note: Some practice content may not be available offline.
              </Typography>
            )}
          </Alert>
        )}
        
        {practiceType === 'freestyle' && (
          <Typography variant="body1" paragraph>
            Record your speech and get detailed analysis including transcription, filler word detection, 
            and speaking rate.
          </Typography>
        )}
        
        {practiceType === 'guided' && practiceContent && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h6" gutterBottom>
              {practiceContent.title}
            </Typography>
            <Typography variant="body2" paragraph>
              Please read the following passage clearly and at a comfortable pace:
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 2, 
                maxHeight: '150px', 
                overflow: 'auto',
                bgcolor: '#ffffff',
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}
            >
              <Typography variant="body1">
                {practiceContent.text}
              </Typography>
            </Paper>
            <Stack direction="row" spacing={1}>
              <Chip 
                size="small" 
                label={`Level: ${practiceContent.level}`} 
                color={practiceContent.level === 'beginner' ? 'success' : 
                      practiceContent.level === 'intermediate' ? 'primary' : 'error'}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`Est. time: ${Math.round(practiceContent.estimatedDuration / 10) * 10}s`} 
                variant="outlined"
              />
            </Stack>
          </Paper>
        )}
        
        {practiceType === 'qa' && practiceContent && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h6" gutterBottom>
              Question to Answer
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: '#ffffff',
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main'
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {practiceContent.question}
              </Typography>
            </Paper>
            {practiceContent.context && (
              <Typography variant="body2" paragraph>
                <strong>Context:</strong> {practiceContent.context}
              </Typography>
            )}
            {practiceContent.suggestedTopics && practiceContent.suggestedTopics.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Suggested topics to address:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {practiceContent.suggestedTopics.map((topic: string, index: number) => (
                    <Chip key={index} size="small" label={topic} variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        )}
        
        {sessionLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {sessionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {sessionError}
          </Alert>
        )}
        
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
              
              {/* Save to session button */}
              {sessionId && audioBlob && userProfile && !sessionSaved && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveToSession}
                  sx={{ mt: 2 }}
                >
                  Save Recording to Session
                </Button>
              )}
              
              {sessionSaved && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Recording saved to session successfully!
                  {isOffline && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Note: The recording will be synchronized to the server when you're back online.
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
          )}
        </Paper>
        
        {/* Reference text section - only show for freestyle practice or if no practice content is loaded */}
        {(practiceType === 'freestyle' || (!practiceContent && practiceType !== 'qa')) && (
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
        )}
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>3. Analyze Speech</Typography>
          <Stack direction="row" spacing={2}>
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
              ) : isOffline ? 'Analyze Speech (Offline)' : 'Analyze Speech'}
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleReturnToDashboard}
              sx={{ mb: 2 }}
            >
              Return to Dashboard
            </Button>
          </Stack>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {isOffline && !transcriptionResults && (
            <Alert severity="info" sx={{ mb: 2 }}>
              In offline mode, speech analysis will use basic processing. 
              For full analysis capabilities, please connect to the internet.
            </Alert>
          )}
          
          {transcriptionResults && (
            <Box sx={{ mt: 3 }}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transcription Result
                    {isOffline && (
                      <Chip 
                        label="Offline Analysis" 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 2, verticalAlign: 'middle' }} 
                      />
                    )}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                    {transcriptionResults.transcript}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/feedback')}
                    sx={{ mb: 2 }}
                  >
                    View AI Coach Feedback
                  </Button>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Speech Metrics:
                    </Typography>
                    
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
                    </Stack>
                    
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {/* Accuracy score for reference text or guided reading */}
                      {accuracyScore !== null && (
                        <Chip 
                          label={`Accuracy: ${accuracyScore}%`}
                          color={accuracyScore > 85 ? "success" : accuracyScore > 70 ? "warning" : "error"}
                        />
                      )}
                      
                      {/* Practice specific metrics */}
                      {practiceType === 'guided' && (
                        <Chip 
                          label={`Reading Performance: ${accuracyScore ? accuracyScore : 'N/A'}`}
                          color={accuracyScore && accuracyScore > 85 ? "success" : 
                                accuracyScore && accuracyScore > 70 ? "warning" : "error"}
                          icon={<MenuBookIcon />}
                        />
                      )}
                      
                      {practiceType === 'qa' && currentSession?.metrics?.structureScore && (
                        <Chip 
                          label={`Response Structure: ${currentSession.metrics.structureScore}/100`}
                          color={currentSession.metrics.structureScore > 85 ? "success" : 
                                currentSession.metrics.structureScore > 70 ? "warning" : "error"}
                          icon={<QuestionAnswerIcon />}
                        />
                      )}
                      
                      {processingTimeMs && (
                        <Chip 
                          label={`Processed in ${(processingTimeMs / 1000).toFixed(1)}s`} 
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
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
