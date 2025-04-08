import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Tabs,
  Tab,
  Button,
  Divider,
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ReplayIcon from '@mui/icons-material/Replay';
import EnhancedAudioRecorder from '../../../shared/components/AudioRecorder/EnhancedAudioRecorder';
import SpeechAnalysisResults from './SpeechAnalysisResults';
import { SpeechAnalysisResult, analyzeSpeech } from '../services/speechAnalysisService';
import { saveSessionToFirestore } from '../services/sessionStorageService';

// Define practice types
interface PracticeType {
  id: string;
  label: string;
  description: string;
  instruction: string;
}

const practiceTypes: PracticeType[] = [
  {
    id: 'freestyle',
    label: 'Freestyle',
    description: 'Speak about any topic of your choice',
    instruction: 'Choose a topic and speak for 1-3 minutes'
  },
  {
    id: 'guided',
    label: 'Guided',
    description: 'Read from provided text',
    instruction: 'Read the text below clearly and at a comfortable pace'
  },
  {
    id: 'interview',
    label: 'Interview Prep',
    description: 'Practice answering common interview questions',
    instruction: 'Answer the question below as you would in an interview'
  }
];

// Sample texts for guided practice
const guidedTexts = [
  "The ability to communicate clearly and effectively is one of the most valuable skills in any professional environment. Whether you're presenting to colleagues, speaking with clients, or interviewing for a new position, your speaking skills can significantly impact your success.",
  "Public speaking is often cited as one of the most common fears. However, with regular practice and feedback, anyone can improve their speaking abilities. The key is to focus on specific aspects of your speech and work on them systematically.",
  "When preparing for an important presentation, consider your audience first. What do they already know about your topic? What information will be most valuable to them? Tailoring your message to your audience's needs is the foundation of effective communication."
];

// Sample questions for interview practice
const interviewQuestions = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths and how do they help you succeed?",
  "Describe a challenging situation you faced at work and how you handled it.",
  "Why are you interested in this position and what can you contribute?",
  "Where do you see yourself professionally in five years?"
];

const PracticeSessionPage: React.FC = () => {
  const theme = useTheme();
  
  // State for practice type and content
  const [practiceType, setPracticeType] = useState<string>('freestyle');
  const [practiceContent, setPracticeContent] = useState<string>('');
  
  // State for analysis
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<Error | null>(null);
  
  // State for notifications
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Handle practice type change
  const handlePracticeTypeChange = (_event: React.SyntheticEvent, newValue: string) => {
    setPracticeType(newValue);
    
    // Reset analysis when changing practice type
    setAudioBlob(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    
    // Set random content for guided practice and interview prep
    if (newValue === 'guided') {
      const randomIndex = Math.floor(Math.random() * guidedTexts.length);
      setPracticeContent(guidedTexts[randomIndex]);
    } else if (newValue === 'interview') {
      const randomIndex = Math.floor(Math.random() * interviewQuestions.length);
      setPracticeContent(interviewQuestions[randomIndex]);
    } else {
      setPracticeContent('');
    }
  };
  
  // Handle audio recording completion
  const handleAudioCaptured = (blob: Blob) => {
    setAudioBlob(blob);
    setAnalysisResult(null);
    setAnalysisError(null);
  };
  
  // Analyze the recorded speech
  const handleAnalyzeSpeech = async () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const result = await analyzeSpeech(audioBlob);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Speech analysis failed:', error);
      setAnalysisError(error instanceof Error ? error : new Error('Analysis failed'));
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Save session to Firestore
  const handleSaveSession = async () => {
    if (!analysisResult) return;
    
    try {
      await saveSessionToFirestore({
        type: practiceType,
        content: practiceContent,
        audioBlob,
        analysis: analysisResult,
        createdAt: new Date()
      });
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Practice session saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save session:', error);
      
      // Show error notification
      setNotification({
        open: true,
        message: 'Failed to save practice session',
        severity: 'error'
      });
    }
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Reset the practice session
  const handleResetSession = () => {
    setAudioBlob(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    
    // Refresh practice content
    if (practiceType === 'guided') {
      const randomIndex = Math.floor(Math.random() * guidedTexts.length);
      setPracticeContent(guidedTexts[randomIndex]);
    } else if (practiceType === 'interview') {
      const randomIndex = Math.floor(Math.random() * interviewQuestions.length);
      setPracticeContent(interviewQuestions[randomIndex]);
    }
  };
  
  // Get the current practice type details
  const currentPracticeType = practiceTypes.find(p => p.id === practiceType) || practiceTypes[0];
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary.main">
        Practice Session
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Practice Type
        </Typography>
        
        <Tabs
          value={practiceType}
          onChange={handlePracticeTypeChange}
          aria-label="practice type tabs"
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
            }
          }}
        >
          {practiceTypes.map((type) => (
            <Tab key={type.id} value={type.id} label={type.label} />
          ))}
        </Tabs>
        
        <Typography variant="subtitle1" gutterBottom>
          {currentPracticeType.description}
        </Typography>
        
        {/* Content for guided practice and interview prep */}
        {(practiceType === 'guided' || practiceType === 'interview') && (
          <Box sx={{ 
            bgcolor: theme.palette.background.default, 
            p: 2, 
            borderRadius: 1,
            mt: 2,
            mb: 3,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="body1">
              {practiceContent}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Audio Recorder */}
      <EnhancedAudioRecorder 
        onAudioCaptured={handleAudioCaptured}
        title="Record Your Speech"
        instructions={currentPracticeType.instruction}
        maxRecordingTime={180} // 3 minutes
      />
      
      {/* Analysis Actions */}
      {audioBlob && !analysisResult && !isAnalyzing && (
        <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleAnalyzeSpeech}
            sx={{ borderRadius: 28, px: 4 }}
          >
            Analyze Speech
          </Button>
        </Box>
      )}
      
      {/* Analysis Results */}
      {(isAnalyzing || analysisResult || analysisError) && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 4 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Analysis Results
            </Typography>
          </Divider>
          
          <SpeechAnalysisResults 
            analysis={analysisResult}
            isLoading={isAnalyzing}
            error={analysisError}
          />
          
          {/* Actions after analysis */}
          {analysisResult && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ReplayIcon />}
                onClick={handleResetSession}
              >
                New Practice
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveSession}
              >
                Save Session
              </Button>
            </Box>
          )}
        </Box>
      )}
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PracticeSessionPage;
