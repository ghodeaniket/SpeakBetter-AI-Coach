import React from 'react';
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
  Chip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import BarChartIcon from '@mui/icons-material/BarChart';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          SpeakBetter AI Coach
        </Typography>
        
        <Typography variant="subtitle1" paragraph>
          Improve your speaking skills with AI-powered analysis and feedback
        </Typography>
        
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Speech Analysis
                </Typography>
                <Typography variant="h3">
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Practice sessions completed
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  startIcon={<MicIcon />}
                  href="/speech-to-text"
                >
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Coach Feedback
                </Typography>
                <Typography variant="h3">
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Feedback messages received
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  startIcon={<VoiceChatIcon />}
                  href="/text-to-speech"
                >
                  Generate Feedback
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Speaking Metrics
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip label="Pace: 0 WPM" color="default" />
                  <Chip label="Fillers: 0%" color="default" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Your average speaking metrics
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  startIcon={<BarChartIcon />}
                  disabled
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Feature Overview */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Available Features
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <RecordVoiceOverIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Speech Analysis</Typography>
                      <Typography variant="body2" paragraph>
                        Record your speech and get detailed analysis including transcription, 
                        filler word detection, and speaking rate.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        href="/speech-to-text"
                      >
                        Try It
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <VoiceChatIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h6">AI Coach Feedback</Typography>
                      <Typography variant="body2" paragraph>
                        Generate natural-sounding speech feedback with customizable voice, 
                        speed, and pitch using advanced AI technology.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        href="/text-to-speech"
                      >
                        Try It
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Progress Tracking</Typography>
                      <Typography variant="body2" paragraph>
                        Track your improvement over time with detailed metrics and 
                        visualization of your speaking patterns.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <TipsAndUpdatesIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Personalized Tips</Typography>
                      <Typography variant="body2" paragraph>
                        Receive tailored speaking improvement suggestions based on 
                        your unique speaking patterns and goals.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Getting Started */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Getting Started
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <MicIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="1. Record Your Speech" 
                secondary="Use the Speech Analysis feature to record a sample of your speaking"
              />
            </ListItem>
            
            <Divider component="li" />
            
            <ListItem>
              <ListItemIcon>
                <RecordVoiceOverIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="2. Review Your Analysis" 
                secondary="Get detailed metrics about your speaking patterns including filler words and pace"
              />
            </ListItem>
            
            <Divider component="li" />
            
            <ListItem>
              <ListItemIcon>
                <VoiceChatIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="3. Generate Feedback" 
                secondary="Use the AI Coach to create customized feedback based on your performance"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default DashboardPage;
