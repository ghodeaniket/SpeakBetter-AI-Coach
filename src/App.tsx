import { useState } from 'react';
import { 
  Container, 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Paper,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import CloudIcon from '@mui/icons-material/Cloud';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Import our validation components
import WebRTCCompatibilityTest from './validation/webrtc/WebRTCCompatibilityTest';
import SpeechToTextTest from './validation/speech-to-text/SpeechToTextTest';
import TextToSpeechTest from './validation/text-to-speech/TextToSpeechTest';
import CloudArchitectureTest from './validation/cloud-architecture/CloudArchitectureTest';

// Import our live validation components
import SpeechToTextLive from './validation/speech-to-text/SpeechToTextLive';
import SpeechToTextLiveFixed from './validation/speech-to-text/SpeechToTextLiveFixed';
import SpeechToTextWithDirect from './validation/speech-to-text/SpeechToTextWithDirect';
import TextToSpeechLive from './validation/text-to-speech/TextToSpeechLive';
import TextToSpeechLiveFixed from './validation/text-to-speech/TextToSpeechLiveFixed';
import SpeechToTextEnhanced from './validation/speech-to-text/SpeechToTextEnhanced';
import SpeechToTextTroubleshooter from './validation/speech-to-text/SpeechToTextTroubleshooter';

// Import direct API components
import { DirectSpeechToText, DirectTextToSpeech } from './validation/direct-api';

// Create theme with the SpeakBetter color scheme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4A55A2',
    },
    secondary: {
      main: '#7986CB',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF7043',
    },
    background: {
      default: '#F5F7FA',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  const drawerWidth = 240;

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handlePageChange = (page: string) => {
    setActivePage(page);
    setDrawerOpen(false);
  };
  
  const renderPage = () => {
    switch (activePage) {
      case 'webrtc':
        return <WebRTCCompatibilityTest />;
      case 'speech-to-text':
        return <SpeechToTextTest />;
      case 'speech-to-text-live':
        return <SpeechToTextLive />;
      case 'speech-to-text-live-fixed':
        return <SpeechToTextLiveFixed />;
      case 'speech-to-text-direct':
        return <SpeechToTextWithDirect />;
      case 'speech-to-text-enhanced':
        return <SpeechToTextEnhanced />;
      case 'speech-to-text-troubleshooter':
        return <SpeechToTextTroubleshooter />;
      case 'speech-to-text-direct-api':
        return <DirectSpeechToText />;
      case 'text-to-speech':
        return <TextToSpeechTest />;
      case 'text-to-speech-live':
        return <TextToSpeechLive />;
      case 'text-to-speech-live-fixed':
        return <TextToSpeechLiveFixed />;
      case 'text-to-speech-direct-api':
        return <DirectTextToSpeech />;
      case 'cloud-architecture':
        return <CloudArchitectureTest />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              SpeakBetter AI Coach - Sprint 0
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'dashboard'}
                  onClick={() => handlePageChange('dashboard')}
                >
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
            </List>
            <Divider />
            <List>
              <ListItem>
                <Typography variant="subtitle2" color="text.secondary">
                  Technical Validation
                </Typography>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'webrtc'}
                  onClick={() => handlePageChange('webrtc')}
                >
                  <ListItemIcon>
                    <MicIcon />
                  </ListItemIcon>
                  <ListItemText primary="WebRTC Compatibility" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text'}
                  onClick={() => handlePageChange('speech-to-text')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Mock" 
                          size="small" 
                          color="default" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text-live'}
                  onClick={() => handlePageChange('speech-to-text-live')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Live API" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text-live-fixed'}
                  onClick={() => handlePageChange('speech-to-text-live-fixed')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Fixed Version" 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text-direct'}
                  onClick={() => handlePageChange('speech-to-text-direct')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Direct Mode" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text-enhanced'}
                  onClick={() => handlePageChange('speech-to-text-enhanced')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Enhanced" 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem', bgcolor: '#4CAF50' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text-troubleshooter'}
                  onClick={() => handlePageChange('speech-to-text-troubleshooter')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Troubleshooter" 
                          size="small" 
                          color="error" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'speech-to-text-direct-api'}
                  onClick={() => handlePageChange('speech-to-text-direct-api')}
                >
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Speech-to-Text
                        <Chip 
                          label="Direct API" 
                          size="small" 
                          color="info" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'text-to-speech'}
                  onClick={() => handlePageChange('text-to-speech')}
                >
                  <ListItemIcon>
                    <VoiceChatIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Text-to-Speech
                        <Chip 
                          label="Mock" 
                          size="small" 
                          color="default" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'text-to-speech-live'}
                  onClick={() => handlePageChange('text-to-speech-live')}
                >
                  <ListItemIcon>
                    <VoiceChatIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Text-to-Speech
                        <Chip 
                          label="Live API" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'text-to-speech-live-fixed'}
                  onClick={() => handlePageChange('text-to-speech-live-fixed')}
                >
                  <ListItemIcon>
                    <VoiceChatIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Text-to-Speech
                        <Chip 
                          label="Fixed Version" 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'text-to-speech-direct-api'}
                  onClick={() => handlePageChange('text-to-speech-direct-api')}
                >
                  <ListItemIcon>
                    <VoiceChatIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Text-to-Speech
                        <Chip 
                          label="Direct API" 
                          size="small" 
                          color="info" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    } 
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activePage === 'cloud-architecture'}
                  onClick={() => handlePageChange('cloud-architecture')}
                >
                  <ListItemIcon>
                    <CloudIcon />
                  </ListItemIcon>
                  <ListItemText primary="Cloud Architecture" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
        
        <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
          <Toolbar />
          {renderPage()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// Simple Dashboard component for the home page
const DashboardPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        SpeakBetter AI Coach - Sprint 0
      </Typography>
      
      <Typography variant="subtitle1" paragraph>
        Technical Validation Phase
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to Sprint 0
        </Typography>
        
        <Typography variant="body1" paragraph>
          This phase focuses on validating the core technical capabilities required for the 
          SpeakBetter AI Coach application. Use the navigation menu to access different
          validation components.
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Live API Validation
        </Typography>
        
        <Typography variant="body1" paragraph color="success.main" fontWeight="bold">
          ✓ Firebase Extensions successfully configured with both Speech-to-Text and Text-to-Speech APIs
        </Typography>
        
        <Typography variant="body1" paragraph color="warning.main" fontWeight="bold">
          ⚠️ Initial Speech-to-Text Integration Issue: There seems to be a collection path mismatch between our code and the Firebase Extension. 
          Use the "Fixed Version" for improved compatibility and debugging.
        </Typography>
        
        <Typography variant="body1" paragraph color="warning.main" fontWeight="bold">
          ⚠️ Text-to-Speech Integration Issue: The initial implementation has difficulties extracting audio URLs from different extension configurations.
          Use the "Fixed Version" which implements automatic collection detection and multiple path handling strategies.
        </Typography>
        
        <Typography variant="body1" paragraph color="success.main" fontWeight="bold">
          ✨ New Enhanced Speech-to-Text Component Added: The enhanced implementation provides better compatibility with different Firebase Extension configurations and improved debugging.
        </Typography>
        
        <Typography variant="body1" paragraph color="info.main" fontWeight="bold">
          🔄 New Direct API Implementation: We've added direct Google Cloud API implementation for both Speech-to-Text and Text-to-Speech, bypassing Firebase Extensions for more control and reliability.
        </Typography>
        
        <Typography variant="body1" paragraph>
          We now have both mock and live implementations available for testing. The live components
          connect to the actual Google Cloud APIs through Firebase Extensions or directly.
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Validation Components
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <MicIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="WebRTC Compatibility Test" 
              secondary="Validates audio recording capabilities across browsers"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <RecordVoiceOverIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Speech-to-Text Test (Multiple Implementations)" 
              secondary="Tests Google Cloud Speech-to-Text API for transcription accuracy"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <VoiceChatIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Text-to-Speech Test (Multiple Implementations)" 
              secondary="Evaluates Google Cloud Text-to-Speech for natural feedback voices"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CloudIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Cloud Architecture Test" 
              secondary="Validates the serverless architecture performance"
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sprint 0 Goals
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemText primary="✅ Validate WebRTC compatibility across target browsers" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✅ Test Speech-to-Text accuracy for filler word detection" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✅ Evaluate Text-to-Speech voice options for coaching feedback" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✅ Measure end-to-end processing latency" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✅ Validate direct integration with Google Cloud APIs" />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default App;
