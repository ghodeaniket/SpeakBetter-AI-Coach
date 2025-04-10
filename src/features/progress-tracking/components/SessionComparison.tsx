import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography,
  Grid,
  Divider,
  useTheme,
  LinearProgress
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { SessionComparison as SessionComparisonType } from '../services/metricsAggregationService';

interface SessionComparisonProps {
  comparison: SessionComparisonType;
  title?: string;
}

const SessionComparison: React.FC<SessionComparisonProps> = ({ 
  comparison,
  title = 'Session Comparison'
}) => {
  const theme = useTheme();

  // Helper function to render trend indicator
  const renderTrend = (value: number, inverse = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const color = isPositive ? theme.palette.success.main : theme.palette.error.main;
    const Icon = isPositive ? ArrowUpwardIcon : ArrowDownwardIcon;
    const label = `${Math.abs(value).toFixed(1)}%`;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color }}>
        <Icon fontSize="small" />
        <Typography variant="body2" sx={{ ml: 0.5 }}>
          {label}
        </Typography>
      </Box>
    );
  };

  // Calculate overall improvement score (0-100)
  const calculateImprovementScore = () => {
    const wpmScore = comparison.wordsPerMinute.change > 0 ? 
      Math.min(comparison.wordsPerMinute.change, 20) / 20 * 33 : 0;
      
    const fillerScore = comparison.fillerWordPercentage.change < 0 ? 
      Math.min(Math.abs(comparison.fillerWordPercentage.change), 20) / 20 * 33 : 0;
      
    const clarityScore = comparison.clarityScore.change > 0 ? 
      Math.min(comparison.clarityScore.change, 15) / 15 * 34 : 0;
      
    return Math.round(wpmScore + fillerScore + clarityScore);
  };

  const improvementScore = calculateImprovementScore();
  
  return (
    <Card sx={{ boxShadow: 1 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Overall Improvement
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={improvementScore} 
                color={improvementScore > 50 ? "success" : "primary"}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: theme.palette.grey[200]
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {improvementScore}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {improvementScore > 75 ? 'Excellent progress!' : 
              improvementScore > 50 ? 'Good improvement!' : 
              improvementScore > 25 ? 'Making progress!' : 
              'Keep practicing!'}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          {/* Speaking Pace */}
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="subtitle2">Speaking Pace</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {comparison.wordsPerMinute.current} WPM
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Previous:
                </Typography>
                <Typography variant="body2">
                  {comparison.wordsPerMinute.previous} WPM
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                {renderTrend(comparison.wordsPerMinute.change)}
              </Box>
            </Box>
          </Grid>
          
          {/* Filler Words */}
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="subtitle2">Filler Words</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {comparison.fillerWordPercentage.current}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Previous:
                </Typography>
                <Typography variant="body2">
                  {comparison.fillerWordPercentage.previous}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                {renderTrend(comparison.fillerWordPercentage.change, true)}
              </Box>
            </Box>
          </Grid>
          
          {/* Clarity Score */}
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="subtitle2">Clarity Score</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {comparison.clarityScore.current}/100
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Previous:
                </Typography>
                <Typography variant="body2">
                  {comparison.clarityScore.previous}/100
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                {renderTrend(comparison.clarityScore.change)}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SessionComparison;
