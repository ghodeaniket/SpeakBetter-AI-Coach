import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Divider,
  Card,
  CardContent,
  Alert,
  Skeleton,
  Snackbar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSpeech } from '../../../shared/contexts/SpeechContext';
import { useFeedbackGeneration } from '../hooks/useFeedbackGeneration';
import { useNavigate, useLocation } from 'react-router-dom';
import FeedbackDisplay from './FeedbackDisplay';
import { MetricsVisualizer } from './MetricsVisualizer';

interface FeedbackPageProps {
  sessionId?: string;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ sessionId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSpeech();
  const { transcriptionResult } = state;
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Use custom hook for feedback generation
  const {
    feedback,
    audioUrl,
    isGenerating,
    isGeneratingAudio,
    feedbackId,
    generateFeedbackForSession,
    generateAudioForFeedback,
    error
  } = useFeedbackGeneration({
    transcriptionResult,
    sessionId,
    autoGenerate: true // Automatically generate when transcription is available
  });
  
  const handleRetry = () => {
    generateFeedbackForSession();
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleRegenerate = () => {
    setSnackbarMessage('Regenerating feedback...');
    setSnackbarOpen(true);
    generateFeedbackForSession();
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // If no transcription data, show error
  if (!transcriptionResult) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">AI Coach Feedback</Typography>
          </Box>
          <Alert severity="warning" sx={{ mb: 3 }}>
            No speech analysis data available. Please record and analyze your speech first.
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>AI Coach Feedback</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRegenerate}
            startIcon={<RefreshIcon />}
            size={isMobile ? "small" : "medium"}
            sx={{ ml: 1 }}
            disabled={isGenerating}
          >
            Regenerate
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message}
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        )}
        
        {/* Feedback display */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FeedbackDisplay 
              feedback={feedback || { text: '' }}
              audioUrl={audioUrl}
              isLoading={isGenerating}
            />
          </Grid>
          
          {/* Metrics display */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Speech Analysis Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {transcriptionResult ? (
                    <MetricsVisualizer 
                      transcriptionResult={transcriptionResult}
                      showProgress={true}
                    />
                  ) : (
                    <Skeleton variant="rectangular" height={200} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Practice suggestions */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 2, mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What's Next?
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" paragraph>
                    To continue improving your speaking skills:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        Practice regularly (aim for 5-10 minutes daily)
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        Focus on the specific suggestions in your feedback
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        Record yourself and compare progress over time
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={handleBack}
                    >
                      Return to Dashboard
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate('/speech-to-text')}
                    >
                      Practice Again
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default FeedbackPage;
