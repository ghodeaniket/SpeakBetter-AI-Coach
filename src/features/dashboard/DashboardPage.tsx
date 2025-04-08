import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  LinearProgress,
  useTheme,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SpeedIcon from '@mui/icons-material/Speed';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../authentication/context/AuthContext';
import { getUserStats, getUserSessions, Session } from '../speech-analysis/services/sessionStorageService';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State for user stats and sessions
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageClarityScore: 0,
    averageWordsPerMinute: 0,
    totalFillerWords: 0,
    averageFillerPercentage: 0,
    lastSessionDate: null as Date | null,
  });
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user stats
        const userStats = await getUserStats(currentUser.uid);
        setStats(userStats);
        
        // Fetch recent sessions
        const sessions = await getUserSessions(currentUser.uid, 3);
        setRecentSessions(sessions);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  // Format date
  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Get color based on clarity score
  const getClarityColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Get color based on filler percentage
  const getFillerColor = (percentage: number) => {
    if (percentage <= 5) return theme.palette.success.main;
    if (percentage <= 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Handle new practice button click
  const handleStartPractice = () => {
    navigate('/practice');
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h5" color="error">
              Error Loading Dashboard
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome section */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary.main">
              Welcome, {currentUser?.displayName?.split(' ')[0] || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your progress and continue improving your speaking skills.
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<MicIcon />}
            onClick={handleStartPractice}
            sx={{ borderRadius: 28, px: 3 }}
          >
            Start Practice
          </Button>
        </Box>
        
        {stats.totalSessions === 0 ? (
          <Box sx={{ mt: 4, p: 3, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Welcome to SpeakBetter AI Coach!
            </Typography>
            <Typography variant="body1" paragraph>
              You haven't completed any practice sessions yet. Start your first session to begin tracking your progress.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleStartPractice}
              startIcon={<MicIcon />}
            >
              Start Your First Session
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Your Progress
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          mr: 2,
                        }}
                      >
                        <MicIcon />
                      </Box>
                      <Typography variant="h6">Total Sessions</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {stats.totalSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last session: {formatDate(stats.lastSessionDate)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'warning.light',
                          color: 'warning.contrastText',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          mr: 2,
                        }}
                      >
                        <SpeedIcon />
                      </Box>
                      <Typography variant="h6">Speaking Rate</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {stats.averageWordsPerMinute ? Math.round(stats.averageWordsPerMinute) : '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      words per minute (average)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'success.light',
                          color: 'success.contrastText',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          mr: 2,
                        }}
                      >
                        <RecordVoiceOverIcon />
                      </Box>
                      <Typography variant="h6">Clarity Score</Typography>
                    </Box>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={stats.averageClarityScore}
                        size={60}
                        thickness={5}
                        sx={{ color: getClarityColor(stats.averageClarityScore), mr: 2 }}
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
                        <Typography variant="body1" fontWeight="bold">
                          {Math.round(stats.averageClarityScore)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: 2, display: 'inline-block' }}>
                      <Typography variant="body2" color="text.secondary">
                        Filler words: {stats.averageFillerPercentage.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(stats.averageFillerPercentage * 10, 100)}
                        sx={{ 
                          mt: 0.5, 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getFillerColor(stats.averageFillerPercentage)
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Recent sessions section */}
      {recentSessions.length > 0 && (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" color="primary.main">
              Recent Practice Sessions
            </Typography>
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/history')}
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {recentSessions.map((session) => (
              <Grid item xs={12} md={4} key={session.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Practice
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(session.createdAt).toLocaleDateString()} • {Math.round(session.analysis.durationSeconds / 60)} min
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Clarity Score:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={getClarityColor(session.analysis.clarityScore)}
                      >
                        {Math.round(session.analysis.clarityScore)}/100
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Words Per Minute:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {session.analysis.wordsPerMinute || '—'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Filler Words:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={getFillerColor(session.analysis.fillerWords?.percentage || 0)}
                      >
                        {session.analysis.fillerWords?.count || 0} ({session.analysis.fillerWords?.percentage.toFixed(1) || '0.0'}%)
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate(`/history/${session.id}`)}
                      endIcon={<TrendingUpIcon fontSize="small" />}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default DashboardPage;
