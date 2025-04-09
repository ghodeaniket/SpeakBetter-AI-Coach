import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  LinearProgress,
  Paper,
  Stack
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Session } from '../../session-management/services/sessionService';

interface ProgressTrackingWidgetProps {
  sessions: Session[];
}

const ProgressTrackingWidget: React.FC<ProgressTrackingWidgetProps> = ({ sessions }) => {
  // Only include completed sessions with analysis
  const completedSessions = sessions.filter(
    (session) => session.status === 'completed' && session.hasAnalysis
  );

  // Returns true if we have enough data to show progress
  const hasEnoughData = completedSessions.length >= 2;

  // Calculate averages based on mock data for now
  // In a real app, we would pull this from the analysis stored in Firestore
  const calculateAverages = () => {
    // Mock data for demonstration - in production this would come from actual session analysis
    return {
      wordsPerMinute: {
        current: 145,
        previous: 135,
        change: 7.4
      },
      fillerWordsPercentage: {
        current: 5.2,
        previous: 7.8,
        change: -33.3
      },
      clarityScore: {
        current: 82,
        previous: 75,
        change: 9.3
      }
    };
  };

  const metrics = calculateAverages();

  // Helper to render trend arrows and colors
  const renderTrend = (change: number, isGoodWhenPositive: boolean = true) => {
    const isPositive = change > 0;
    const isGood = isPositive === isGoodWhenPositive;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        color: isGood ? 'success.main' : 'error.main' 
      }}>
        {isPositive ? (
          <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
        ) : (
          <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
        )}
        <Typography variant="body2" component="span">
          {Math.abs(change).toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <TrendingUpIcon sx={{ mr: 1 }} />
          Speaking Progress
        </Typography>

        {!hasEnoughData ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Complete at least 2 sessions to see your progress trends
            </Typography>
            <LinearProgress sx={{ mt: 2, mb: 1 }} variant="determinate" value={
              (completedSessions.length / 2) * 100
            } />
            <Typography variant="caption" color="text.secondary">
              {completedSessions.length}/2 sessions completed
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Speaking Pace
                  </Typography>
                  <Typography variant="h6">
                    {metrics.wordsPerMinute.current} WPM
                  </Typography>
                </Box>
                {renderTrend(metrics.wordsPerMinute.change)}
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((metrics.wordsPerMinute.current / 200) * 100, 100)}
                sx={{ mt: 1 }}
                color="primary"
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Filler Words
                  </Typography>
                  <Typography variant="h6">
                    {metrics.fillerWordsPercentage.current}%
                  </Typography>
                </Box>
                {renderTrend(metrics.fillerWordsPercentage.change, false)}
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100 - (metrics.fillerWordsPercentage.current / 15) * 100, 100)}
                sx={{ mt: 1 }}
                color="secondary"
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Clarity Score
                  </Typography>
                  <Typography variant="h6">
                    {metrics.clarityScore.current}/100
                  </Typography>
                </Box>
                {renderTrend(metrics.clarityScore.change)}
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={metrics.clarityScore.current}
                sx={{ mt: 1 }}
                color="success"
              />
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTrackingWidget;
