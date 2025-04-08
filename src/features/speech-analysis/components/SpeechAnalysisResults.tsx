import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Chip, 
  Grid, 
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  CircularProgress,
  useTheme
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import MicIcon from '@mui/icons-material/Mic';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import { SpeechAnalysisResult } from '../services/speechAnalysisService';

interface SpeechAnalysisResultsProps {
  analysis: SpeechAnalysisResult | null;
  isLoading?: boolean;
  error?: Error | null;
}

const SpeechAnalysisResults: React.FC<SpeechAnalysisResultsProps> = ({ 
  analysis, 
  isLoading = false,
  error = null
}) => {
  const theme = useTheme();
  
  // Function to get color based on clarity score
  const getClarityColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Function to get speaking rate evaluation
  const getSpeakingRateEvaluation = (wpm: number | null) => {
    if (wpm === null) return { text: 'Unable to calculate', color: theme.palette.text.secondary };
    
    if (wpm > 190) return { text: 'Too Fast', color: theme.palette.error.main };
    if (wpm > 170) return { text: 'Slightly Fast', color: theme.palette.warning.main };
    if (wpm >= 140) return { text: 'Good Pace', color: theme.palette.success.main };
    if (wpm >= 120) return { text: 'Slightly Slow', color: theme.palette.warning.main };
    return { text: 'Too Slow', color: theme.palette.error.main };
  };
  
  // Function to get filler word evaluation
  const getFillerEvaluation = (percentage: number | undefined) => {
    if (percentage === undefined) return { text: 'None detected', color: theme.palette.success.main };
    
    if (percentage > 15) return { text: 'Very High', color: theme.palette.error.main };
    if (percentage > 10) return { text: 'High', color: theme.palette.error.main };
    if (percentage > 5) return { text: 'Moderate', color: theme.palette.warning.main };
    if (percentage > 2) return { text: 'Low', color: theme.palette.success.light };
    return { text: 'Very Low', color: theme.palette.success.main };
  };
  
  // Highlight filler words in the transcript
  const highlightedTranscript = useMemo(() => {
    if (!analysis?.transcript) return null;
    
    let transcript = analysis.transcript;
    const fillerWords = analysis.fillerWords?.words || [];
    
    // Skip highlighting if no filler words
    if (fillerWords.length === 0) {
      return <Typography variant="body1">{transcript}</Typography>;
    }
    
    // Sort filler words by timestamp to process from end to start
    // (to avoid position shifts when replacing text)
    const sortedFillers = [...fillerWords].sort((a, b) => b.timestamp - a.timestamp);
    
    // Create an array of segment positions
    const segments: { text: string; isFiller: boolean }[] = [{ text: transcript, isFiller: false }];
    
    // Process each filler word
    for (const filler of sortedFillers) {
      // For simplicity, we'll use a naive approach by directly replacing
      // This doesn't account for repeated filler words, but works for demonstration
      
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].isFiller) continue;
        
        const segment = segments[i];
        const fillerIndex = segment.text.toLowerCase().indexOf(filler.word.toLowerCase());
        
        if (fillerIndex !== -1) {
          // Split the segment into three parts: before, filler, after
          const before = segment.text.substring(0, fillerIndex);
          const fillerText = segment.text.substring(fillerIndex, fillerIndex + filler.word.length);
          const after = segment.text.substring(fillerIndex + filler.word.length);
          
          // Replace the current segment with the three new segments
          segments.splice(i, 1, 
            { text: before, isFiller: false },
            { text: fillerText, isFiller: true },
            { text: after, isFiller: false }
          );
          
          // Skip to the next filler word
          break;
        }
      }
    }
    
    // Combine adjacent segments of the same type and filter out empty segments
    const combinedSegments: { text: string; isFiller: boolean }[] = [];
    
    for (const segment of segments) {
      if (segment.text.length === 0) continue;
      
      if (combinedSegments.length === 0 || combinedSegments[combinedSegments.length - 1].isFiller !== segment.isFiller) {
        combinedSegments.push(segment);
      } else {
        combinedSegments[combinedSegments.length - 1].text += segment.text;
      }
    }
    
    // Render the segments
    return (
      <Typography variant="body1">
        {combinedSegments.map((segment, index) => (
          segment.isFiller ? (
            <Tooltip key={index} title="Filler word" arrow>
              <Box component="span" sx={{ 
                bgcolor: 'error.light',
                color: 'error.contrastText',
                px: 0.5,
                py: 0.2,
                borderRadius: 1,
                mx: 0.2
              }}>
                {segment.text}
              </Box>
            </Tooltip>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        ))}
      </Typography>
    );
  }, [analysis?.transcript, analysis?.fillerWords?.words]);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Analyzing your speech...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This may take up to 15 seconds
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3, bgcolor: 'error.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
          <Typography variant="h6" color="error.main">
            Analysis Error
          </Typography>
        </Box>
        <Typography variant="body1" color="error.dark">
          {error.message || 'An error occurred while analyzing your speech. Please try again.'}
        </Typography>
      </Paper>
    );
  }
  
  // No analysis yet
  if (!analysis) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MicIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" color="primary.main">
            Speech Analysis
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Record your speech to see detailed analysis including transcription, speaking rate, clarity score, and filler word detection.
        </Typography>
      </Paper>
    );
  }
  
  // Speaking rate evaluation
  const rateEval = getSpeakingRateEvaluation(analysis.wordsPerMinute);
  
  // Filler word evaluation
  const fillerEval = getFillerEvaluation(analysis.fillerWords?.percentage);
  
  return (
    <Box>
      {/* Summary Card */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom color="primary.main">
          Speech Analysis Results
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          {/* Clarity Score */}
          <Grid item xs={12} md={4}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom color="text.secondary">
                  Clarity Score
                </Typography>
                
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={analysis.clarityScore}
                    size={80}
                    thickness={5}
                    sx={{ color: getClarityColor(analysis.clarityScore) }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="div"
                      color="text.primary"
                      fontWeight="bold"
                    >
                      {Math.round(analysis.clarityScore)}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Based on pace, filler words, and confidence
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Speaking Rate */}
          <Grid item xs={12} md={4}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom color="text.secondary">
                  Speaking Rate
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <SpeedIcon sx={{ fontSize: 32, color: rateEval.color, mr: 1 }} />
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {analysis.wordsPerMinute || '---'} WPM
                  </Typography>
                </Box>
                
                <Chip 
                  label={rateEval.text} 
                  size="small" 
                  sx={{ 
                    bgcolor: rateEval.color, 
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }} 
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ideal: 140-170 words per minute
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Filler Words */}
          <Grid item xs={12} md={4}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom color="text.secondary">
                  Filler Words
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {analysis.fillerWords ? 
                      `${analysis.fillerWords.count} (${analysis.fillerWords.percentage.toFixed(1)}%)` : 
                      '0 (0%)'}
                  </Typography>
                </Box>
                
                <Chip 
                  label={fillerEval.text} 
                  size="small" 
                  sx={{ 
                    bgcolor: fillerEval.color, 
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }} 
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Common: um, uh, like, so, you know
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Transcript */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary.main">
            Transcript
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {formatTime(analysis.durationSeconds)}
            </Typography>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1.5, height: 16 }} />
            
            <Typography variant="body2" color="text.secondary">
              {analysis.wordCount} words
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
          {highlightedTranscript}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TimerIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            Processed in {(analysis.processingTimeMs / 1000).toFixed(1)} seconds
          </Typography>
          
          {analysis.confidence && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5, height: 12 }} />
              <Typography variant="caption" color="text.secondary">
                Confidence: {(analysis.confidence * 100).toFixed(0)}%
              </Typography>
            </>
          )}
        </Box>
      </Paper>
      
      {/* Filler Words Details */}
      {analysis.fillerWords && analysis.fillerWords.count > 0 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Filler Word Details
          </Typography>
          
          <Grid container spacing={2}>
            {analysis.fillerWords.words.map((filler, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Chip 
                  label={filler.word} 
                  color="error"
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  at {formatTime(filler.timestamp)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default SpeechAnalysisResults;
