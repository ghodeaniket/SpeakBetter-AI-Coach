import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  LinearProgress, 
  Tooltip,
  useTheme,
  Divider,
  Stack
} from '@mui/material';
import { TranscriptionResult } from '../../../../services/google-cloud/speech';
import MicIcon from '@mui/icons-material/Mic';
import SpeedIcon from '@mui/icons-material/Speed';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TimerIcon from '@mui/icons-material/Timer';

interface MetricsVisualizerProps {
  transcriptionResult: TranscriptionResult;
  showProgress?: boolean;
  compact?: boolean;
}

// Helper to format milliseconds as minutes:seconds
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const MetricsVisualizer: React.FC<MetricsVisualizerProps> = ({
  transcriptionResult,
  showProgress = true,
  compact = false
}) => {
  const theme = useTheme();
  
  // Extract relevant metrics from transcription result
  const {
    wordsPerMinute = 0,
    totalWords = 0,
    fillerWordCount = 0,
    confidence = 0,
    durationMs = 0,
  } = transcriptionResult;
  
  // Calculate derived metrics
  const clarityScore = Math.round(confidence * 100);
  const fillerWordPercentage = totalWords > 0 ? (fillerWordCount / totalWords) * 100 : 0;
  
  // Evaluate metrics against thresholds
  const getSpeedColor = (wpm: number): string => {
    if (wpm < 110) return theme.palette.warning.main; // Too slow
    if (wpm > 170) return theme.palette.warning.main; // Too fast
    return theme.palette.success.main; // Good
  };
  
  const getFillerWordColor = (percentage: number): string => {
    if (percentage > 8) return theme.palette.error.main; // Too many
    if (percentage > 5) return theme.palette.warning.main; // Some
    return theme.palette.success.main; // Few
  };
  
  const getClarityColor = (score: number): string => {
    if (score < 60) return theme.palette.error.main; // Poor
    if (score < 75) return theme.palette.warning.main; // Okay
    return theme.palette.success.main; // Good
  };
  
  // Get normalized progress values (0-100)
  const getSpeedProgress = (wpm: number): number => {
    // Normalize around optimal range (120-160 WPM)
    if (wpm < 110) return Math.max(50 * (wpm / 110), 10); // Slower than optimal
    if (wpm > 170) return Math.max(100 - (wpm - 170), 10); // Faster than optimal
    return 100 - Math.abs(((wpm - 140) / 30) * 50); // Within optimal range
  };
  
  const getFillerWordProgress = (percentage: number): number => {
    // Lower is better for filler words
    return Math.max(100 - (percentage * 10), 5);
  };
  
  const getClarityProgress = (score: number): number => {
    // Direct mapping for clarity score
    return score;
  };
  
  // Compact view for mobile
  if (compact) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Speech Metrics
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Tooltip title="Speaking Rate">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'grey.100',
                px: 1.5,
                py: 0.5,
                borderRadius: 1
              }}>
                <SpeedIcon fontSize="small" sx={{ mr: 0.5, color: getSpeedColor(wordsPerMinute) }} />
                <Typography variant="body2">{Math.round(wordsPerMinute)} WPM</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Filler Words">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'grey.100',
                px: 1.5,
                py: 0.5,
                borderRadius: 1
              }}>
                <RecordVoiceOverIcon fontSize="small" sx={{ mr: 0.5, color: getFillerWordColor(fillerWordPercentage) }} />
                <Typography variant="body2">{fillerWordPercentage.toFixed(1)}%</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Clarity Score">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'grey.100',
                px: 1.5,
                py: 0.5,
                borderRadius: 1
              }}>
                <MicIcon fontSize="small" sx={{ mr: 0.5, color: getClarityColor(clarityScore) }} />
                <Typography variant="body2">{clarityScore}/100</Typography>
              </Box>
            </Tooltip>
          </Stack>
          
          <Typography variant="caption" color="text.secondary">
            {totalWords} words • {formatDuration(durationMs)} duration
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Speech Analysis Metrics
        </Typography>
        
        <Grid container spacing={3}>
          {/* Speaking Rate */}
          <Grid item xs={12} sm={4}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    bgcolor: 'primaryLighter.main',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}>
                    <SpeedIcon fontSize="small" color="primary" />
                  </Box>
                  <Typography variant="subtitle2">
                    Speaking Rate
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: getSpeedColor(wordsPerMinute) }}>
                    {Math.round(wordsPerMinute)} WPM
                  </Typography>
                </Box>
              </Box>
              
              {showProgress && (
                <Tooltip title="Optimal range: 120-160 WPM">
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={getSpeedProgress(wordsPerMinute)} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getSpeedColor(wordsPerMinute),
                        }
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {wordsPerMinute < 110 ? 'Slower than optimal' : 
                 wordsPerMinute > 170 ? 'Faster than optimal' : 
                 'Good pace'}
              </Typography>
            </Box>
          </Grid>
          
          {/* Filler Words */}
          <Grid item xs={12} sm={4}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    bgcolor: 'primaryLighter.main',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}>
                    <RecordVoiceOverIcon fontSize="small" color="primary" />
                  </Box>
                  <Typography variant="subtitle2">
                    Filler Words
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: getFillerWordColor(fillerWordPercentage) }}>
                    {fillerWordPercentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              
              {showProgress && (
                <Tooltip title="Lower is better">
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={getFillerWordProgress(fillerWordPercentage)} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getFillerWordColor(fillerWordPercentage),
                        }
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {fillerWordCount} filler words found
              </Typography>
            </Box>
          </Grid>
          
          {/* Clarity Score */}
          <Grid item xs={12} sm={4}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    bgcolor: 'primaryLighter.main',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}>
                    <MicIcon fontSize="small" color="primary" />
                  </Box>
                  <Typography variant="subtitle2">
                    Clarity Score
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: getClarityColor(clarityScore) }}>
                    {clarityScore}/100
                  </Typography>
                </Box>
              </Box>
              
              {showProgress && (
                <Tooltip title="Based on speech recognition confidence">
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={getClarityProgress(clarityScore)} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getClarityColor(clarityScore),
                        }
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {clarityScore < 60 ? 'Needs improvement' : 
                 clarityScore < 75 ? 'Average clarity' : 
                 'Excellent clarity'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: { xs: 1, sm: 0 } }}>
            <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Duration: {formatDuration(durationMs)}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {totalWords} total words • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricsVisualizer;
