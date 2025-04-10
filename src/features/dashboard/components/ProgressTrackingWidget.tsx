import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Button,
  Skeleton
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate } from 'react-router-dom';
import { useProgressData } from '../../progress-tracking/hooks/useProgressData';

interface ProgressTrackingWidgetProps {
  showViewAll?: boolean;
}

const ProgressTrackingWidget: React.FC<ProgressTrackingWidgetProps> = ({ 
  showViewAll = true
}) => {
  const navigate = useNavigate();
  const { loading, error, metrics, newAchievements } = useProgressData();

  // Helper to render trend arrows and colors
  const renderTrend = (change: number, isGoodWhenPositive: boolean = true) => {
    if (Math.abs(change) < 2) {
      return null; // No significant change
    }
    
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
    <Card sx={{ height: '100%', mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" display="flex" alignItems="center">
            <BarChartIcon sx={{ mr: 1 }} />
            Speaking Progress
          </Typography>
          
          {showViewAll && (
            <Button 
              size="small" 
              color="primary"
              onClick={() => navigate('/progress')}
            >
              View All
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="error">
              Error loading progress data
            </Typography>
          </Box>
        ) : !metrics ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Complete at least 1 session to see your progress trends
            </Typography>
            <LinearProgress sx={{ mt: 2, mb: 1 }} variant="determinate" value={0} />
            <Typography variant="caption" color="text.secondary">
              0/1 sessions completed
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
                {renderTrend(metrics.wordsPerMinute.trend)}
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
                    {metrics.fillerWordPercentage.current}%
                  </Typography>
                </Box>
                {renderTrend(metrics.fillerWordPercentage.trend, false)}
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100 - (metrics.fillerWordPercentage.current / 15) * 100, 100)}
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
                {renderTrend(metrics.clarityScore.trend)}
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={metrics.clarityScore.current}
                sx={{ mt: 1 }}
                color="success"
              />
            </Paper>
            
            {newAchievements && newAchievements.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/progress')}
                >
                  {newAchievements.length} New Achievement{newAchievements.length > 1 ? 's' : ''}!
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTrackingWidget;
