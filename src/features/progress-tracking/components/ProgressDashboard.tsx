import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  CircularProgress,
  Paper,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { useProgressData } from '../hooks/useProgressData';
import MetricsChart from './MetricsChart';
import AchievementCard from './AchievementCard';

const ProgressDashboard: React.FC = () => {
  const theme = useTheme();
  const { 
    loading, 
    error, 
    metrics, 
    achievements, 
    newAchievements,
    refreshData,
    clearNewAchievements
  } = useProgressData();
  
  const [showAchievementDialog, setShowAchievementDialog] = useState<boolean>(false);
  const [achievementSnackbar, setAchievementSnackbar] = useState<boolean>(false);
  
  // Show achievement dialog if there are new achievements
  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      setShowAchievementDialog(true);
    }
  }, [newAchievements]);
  
  // Handle closing the achievement dialog
  const handleCloseAchievementDialog = () => {
    setShowAchievementDialog(false);
    clearNewAchievements();
    setAchievementSnackbar(true);
  };
  
  // Render trend indicator
  const renderTrend = (value: number, inverse = false) => {
    if (Math.abs(value) < 2) {
      return <TrendingFlatIcon sx={{ color: theme.palette.grey[500], verticalAlign: 'middle' }} />;
    }
    
    const isPositive = inverse ? value < 0 : value > 0;
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    const color = isPositive ? theme.palette.success.main : theme.palette.error.main;
    
    return <Icon sx={{ color, verticalAlign: 'middle' }} />;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={refreshData}>
            Retry
          </Button>
        }
      >
        Error loading progress data: {error.message}
      </Alert>
    );
  }
  
  if (!metrics) {
    return (
      <Alert severity="info">
        No progress data available yet. Complete your first practice session to see your progress.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
        Progress Dashboard
      </Typography>
      
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RecordVoiceOverIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Sessions
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ my: 1 }}>
                {metrics.totalSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total practice sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Practice Time
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ my: 1 }}>
                {metrics.totalPracticingTime} min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total time spent practicing
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box component="span" sx={{ mr: 1, color: theme.palette.primary.main }}>
                  WPM
                </Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Speaking Pace
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ my: 1 }}>
                  {metrics.wordsPerMinute.current}
                </Typography>
                <Box sx={{ ml: 1 }}>
                  {renderTrend(metrics.wordsPerMinute.trend)}
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {metrics.wordsPerMinute.trend > 0 
                  ? `${Math.abs(metrics.wordsPerMinute.trend)}% faster than before`
                  : metrics.wordsPerMinute.trend < 0
                    ? `${Math.abs(metrics.wordsPerMinute.trend)}% slower than before`
                    : 'No significant change'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box component="span" sx={{ mr: 1, color: theme.palette.warning.main }}>
                  %
                </Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Filler Words
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ my: 1 }}>
                  {metrics.fillerWordPercentage.current}%
                </Typography>
                <Box sx={{ ml: 1 }}>
                  {renderTrend(metrics.fillerWordPercentage.trend, true)}
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {metrics.fillerWordPercentage.trend < 0 
                  ? `${Math.abs(metrics.fillerWordPercentage.trend)}% fewer than before`
                  : metrics.fillerWordPercentage.trend > 0
                    ? `${Math.abs(metrics.fillerWordPercentage.trend)}% more than before`
                    : 'No significant change'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts and Achievements */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <MetricsChart data={metrics.weeklyData} height={350} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEventsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">
                  Your Achievements
                </Typography>
              </Box>
              
              {achievements.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Keep practicing to earn achievements!
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ maxHeight: 280, overflow: 'auto', pr: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {achievements.slice().reverse().map((achievement) => (
                      <AchievementCard 
                        key={achievement.id} 
                        achievement={achievement}
                        isNew={newAchievements && newAchievements.includes(achievement.id)}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* New Achievement Dialog */}
      <Dialog 
        open={showAchievementDialog} 
        onClose={handleCloseAchievementDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant="h5" component="div">
            New Achievement Unlocked!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {newAchievements && newAchievements.map((achievementId) => {
              const achievement = achievements.find(a => a.id === achievementId);
              return achievement ? (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement}
                  isNew={true}
                />
              ) : null;
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleCloseAchievementDialog} 
            variant="contained"
            color="primary"
            size="large"
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Achievement Snackbar */}
      <Snackbar
        open={achievementSnackbar}
        autoHideDuration={5000}
        onClose={() => setAchievementSnackbar(false)}
        message={newAchievements ? 
          `You've unlocked ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}!` :
          "New achievements unlocked!"
        }
      />
    </Box>
  );
};

export default ProgressDashboard;
