import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Tabs,
  Tab,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import BarChartIcon from '@mui/icons-material/BarChart';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HistoryIcon from '@mui/icons-material/History';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SchoolIcon from '@mui/icons-material/School';
import FeedbackIcon from '@mui/icons-material/Feedback';
import TuneIcon from '@mui/icons-material/Tune';

import { useAuth } from '../../shared/contexts/AuthContext';
import { SessionList } from '../session-management';
import { useSessionManagement } from '../session-management/hooks/useSessionManagement';
import { OnboardingTips } from '../auth/components';
import { 
  ProgressTrackingWidget,
  RecentSessionsWidget,
  QuickActionCard,
  UserGoalsWidget
} from './components';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  // Removed tabValue state as we now use proper routes for navigation
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Removed tab parameter handling as we now use proper routes for navigation
  
  const {
    sessions,
    isLoading,
    error,
    createNewSession,
    loadSession,
    removeSession
  } = useSessionManagement({ userId: userProfile?.uid || null });
  
  // Check if we should show onboarding based on session count
  useEffect(() => {
    // Show onboarding for new users with 2 or fewer sessions
    if (sessions.length <= 2 && !isLoading) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [sessions.length, isLoading]);

  // Removed tab change handler as we now use proper routes for navigation

  const handleSessionSelect = (sessionId: string) => {
    // Prevent multiple navigation calls
    if (sessionId) {
      navigate(`/speech-to-text?sessionId=${sessionId}`, { 
        replace: true  // Use replace to prevent adding extra history entries
      });
    }
  };

  const handleSessionCreate = async (type: 'freestyle' | 'guided' | 'qa') => {
    try {
      const sessionId = await createNewSession(type);
      navigate(`/speech-to-text?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  // Calculate stats for the overview cards
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const feedbackCount = sessions.filter(s => s.hasFeedback).length;
  
  return (
    <Container maxWidth="lg">
      <Fade in={true} timeout={500}>
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="500">
              SpeakBetter AI Coach
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary">
              Improve your speaking skills with AI-powered analysis and feedback
            </Typography>
          </Box>
          
          {/* Onboarding Tips for new users */}
          {showOnboarding && (
            <Zoom in={showOnboarding} timeout={500}>
              <Box sx={{ mb: 4 }}>
                <OnboardingTips onDismiss={() => setShowOnboarding(false)} />
              </Box>
            </Zoom>
          )}
          
          {/* Test navigation buttons removed */}
          
          <Paper elevation={2} sx={{ mt: 4 }}>
            {/* Session history is now handled by the sidebar navigation
               to avoid duplicate UI patterns and confusion */}
            <Box sx={{ p: 3 }}>
              {/* Dashboard content */}
              <Grid container spacing={3}>
                  {/* Left column */}
                  <Grid item xs={12} lg={8}>
                    {/* Quick stats row */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} lg={6}>
                        <Card elevation={1} sx={{ 
                          height: '100%',
                          background: 'linear-gradient(to right, #4A55A2, #7986CB)',
                          color: 'white' 
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2
                              }}>
                                <MicIcon />
                              </Box>
                              <Box>
                                <Typography variant="overline" sx={{ opacity: 0.7 }}>
                                  Completed Sessions
                                </Typography>
                                <Typography variant="h4">
                                  {completedSessions}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                              <Button 
                                variant="contained" 
                                sx={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                  },
                                  flex: 1
                                }}
                                startIcon={<MicIcon />}
                                onClick={() => navigate('/practice')}
                              >
                                Practice Modes
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid xs={12} lg={6}>
                        <Card elevation={1} sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ 
                                backgroundColor: 'rgba(74, 85, 162, 0.1)',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                color: 'primary.main'
                              }}>
                                <FeedbackIcon />
                              </Box>
                              <Box>
                                <Typography variant="overline" color="text.secondary">
                                  AI Feedback
                                </Typography>
                                <Typography variant="h4" color="primary.main">
                                  {feedbackCount}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Button 
                              variant="outlined" 
                              color="primary" 
                              sx={{ mt: 2 }}
                              startIcon={<VoiceChatIcon />}
                              onClick={() => navigate('/text-to-speech')}
                            >
                              Get Feedback
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Recent sessions */}
                    <Box sx={{ mb: 3 }}>
                      <RecentSessionsWidget 
                        sessions={sessions}
                        isLoading={isLoading}
                        onCreateSession={handleSessionCreate}
                      />
                    </Box>
                    
                    {/* Rest of the dashboard content */}
                  </Grid>
                  
                  {/* Right column */}
                  <Grid item xs={12} lg={4}>
                    <UserGoalsWidget />
                    <ProgressTrackingWidget sessions={sessions} />
                    {/* Other widgets */}
                  </Grid>
                </Grid>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default DashboardPage;