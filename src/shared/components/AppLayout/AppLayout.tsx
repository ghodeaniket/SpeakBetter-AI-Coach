import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
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
  useMediaQuery,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Slide,
  Snackbar,
  Alert,
  Tooltip,
  LinearProgress,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import MenuIcon from '@mui/icons-material/Menu';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import { UserProfile } from '../../../features/auth/components';
import { useAuth } from '../../contexts/AuthContext';
import { useSessionManagement } from '../../../features/session-management/hooks/useSessionManagement';
import { useProgressData } from '../../../features/progress-tracking/hooks/useProgressData';
import { LoadingScreen } from '../common';

// Dialog transition effect
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, isLoading: authLoading } = useAuth();
  
  // Session management - with error handling
  const sessionManagement = useSessionManagement({ 
    userId: userProfile?.uid || null 
  });
  
  // Progress tracking
  const { newAchievements, loading: progressLoading } = useProgressData();
  
  const sessions = sessionManagement?.sessions || [];
  const sessionsLoading = sessionManagement?.isLoading || false;
  const sessionsError = sessionManagement?.error || null;
  
  // Count sessions with different statuses
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const inProgressSessions = sessions.filter(s => ['created', 'recording', 'processing'].includes(s.status)).length;
  
  // Show error message for Firestore index issues
  useEffect(() => {
    if (sessionsError && sessionsError.includes('index')) {
      setSnackbarMessage('Database is preparing. Please wait a few moments and try again.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  }, [sessionsError]);
  
  const drawerWidth = 240;
  
  // Check if first visit and show welcome dialog
  useEffect(() => {
    if (userProfile && !authLoading) {
      const firstVisitKey = `first-visit-${userProfile.uid}`;
      const hasVisitedBefore = localStorage.getItem(firstVisitKey);
      
      if (!hasVisitedBefore) {
        setIsFirstVisit(true);
        setWelcomeDialogOpen(true);
        localStorage.setItem(firstVisitKey, 'true');
      }
    }
  }, [userProfile, authLoading]);
  
  // Show notification when returning to dashboard with completed sessions
  useEffect(() => {
    if (location.pathname === '/' && location.state?.fromSession) {
      setSnackbarMessage('Session saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const closeDrawer = () => {
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  const handleWelcomeDialogClose = () => {
    setWelcomeDialogOpen(false);
  };
  
  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  const handleStartFirstSession = () => {
    setWelcomeDialogOpen(false);
    navigate('/speech-to-text');
  };
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Speech Analysis',
      icon: <RecordVoiceOverIcon />,
      path: '/speech-to-text',
    },
    {
      text: 'AI Feedback',
      icon: <VoiceChatIcon />,
      path: '/feedback',
    },
    {
      text: 'Progress Tracking',
      icon: <BarChartIcon />,
      path: '/progress',
      badge: (!progressLoading && newAchievements) ? newAchievements.length : 0
    },
    {
      text: 'Session History',
      icon: <HistoryIcon />,
      path: '/history',
      badge: completedSessions
    },
    {
      text: 'My Profile',
      icon: <PersonIcon />,
      path: '/profile',
    }
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ 
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6" component="div" color="primary" fontWeight="bold">
          SpeakBetter
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              onClick={closeDrawer}
              selected={location.pathname === item.path}
              sx={{ 
                borderRadius: 1, 
                mx: 1, 
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primaryLighter.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.badge && item.badge > 0 && (
                <Badge badgeContent={item.badge} color="primary" sx={{ ml: 1 }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => setWelcomeDialogOpen(true)}
            sx={{ 
              borderRadius: 1, 
              mx: 1,
              mb: 0.5
            }}
          >
            <ListItemIcon>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Help & Guide" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          SpeakBetter AI Coach v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            color: 'text.primary'
          }}
          elevation={0}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography 
              variant="h6" 
              noWrap 
              component={Link} 
              to="/" 
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 'bold',
                display: { xs: 'block', md: 'none' } 
              }}
            >
              SpeakBetter
            </Typography>
            
            {userProfile && (
              <>
                <Tooltip title="Start practice session">
                  <IconButton 
                    color="primary" 
                    aria-label="start practice"
                    component={Link}
                    to="/speech-to-text"
                    sx={{ 
                      mr: 1,
                      backgroundColor: 'rgba(74, 85, 162, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(74, 85, 162, 0.15)',
                      }
                    }}
                  >
                    <MicIcon />
                  </IconButton>
                </Tooltip>
                
                {inProgressSessions > 0 && (
                  <Tooltip title={`${inProgressSessions} session${inProgressSessions !== 1 ? 's' : ''} in progress`}>
                    <Badge badgeContent={inProgressSessions} color="warning" sx={{ mr: 1 }}>
                      <IconButton 
                        color="inherit" 
                        aria-label="in-progress sessions"
                        component={Link}
                        to="/history"
                      >
                        <NotificationsIcon />
                      </IconButton>
                    </Badge>
                  </Tooltip>
                )}
                
                {!progressLoading && newAchievements && newAchievements.length > 0 && (
                  <Tooltip title={`${newAchievements.length} new achievement${newAchievements.length !== 1 ? 's' : ''}!`}>
                    <Badge badgeContent={newAchievements.length} color="success" sx={{ mr: 1 }}>
                      <IconButton 
                        color="inherit" 
                        aria-label="view achievements"
                        component={Link}
                        to="/progress"
                      >
                        <BarChartIcon />
                      </IconButton>
                    </Badge>
                  </Tooltip>
                )}
              </>
            )}
            
            <UserProfile compact />
          </Toolbar>
        </AppBar>
        
        {/* Desktop drawer (permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
        
        {/* Mobile drawer (temporary) */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Toolbar />
          
          {/* Loading indicator for sessions */}
          {sessionsLoading && (
            <LinearProgress sx={{ position: 'absolute', top: '64px', left: 0, right: 0, zIndex: 1 }} />
          )}
          
          {/* Main content with subtle animation */}
          <Box sx={{ 
            flexGrow: 1,
            animation: 'fadeIn 0.5s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            }
          }}>
            {children}
          </Box>
          
          {/* Welcome Dialog for First-time Users */}
          <Dialog
            open={welcomeDialogOpen}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleWelcomeDialogClose}
            aria-describedby="welcome-dialog-description"
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  backgroundColor: 'primary.light',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  mr: 2
                }}>
                  <VoiceChatIcon />
                </Box>
                <Typography variant="h6">Welcome to SpeakBetter AI Coach!</Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <DialogContentText id="welcome-dialog-description" paragraph>
                Thank you for joining SpeakBetter! Here's a quick guide to get you started:
              </DialogContentText>
              
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <Box sx={{ 
                      backgroundColor: 'primaryLighter.main',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MicIcon color="primary" fontSize="small" />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="subtitle1">Record Your Speech</Typography>}
                    secondary="Use the Speech Analysis feature to record a sample of your speaking"
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      backgroundColor: 'primaryLighter.main',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <RecordVoiceOverIcon color="primary" fontSize="small" />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="subtitle1">Review Your Analysis</Typography>}
                    secondary="Get detailed metrics about your speaking patterns including filler words and pace"
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      backgroundColor: 'primaryLighter.main',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <VoiceChatIcon color="primary" fontSize="small" />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="subtitle1">Generate Feedback</Typography>}
                    secondary="Use the AI Coach to create customized feedback based on your performance"
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      backgroundColor: 'primaryLighter.main',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BarChartIcon color="primary" fontSize="small" />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="subtitle1">Track Your Progress</Typography>}
                    secondary="Visit the Progress Tracking page to see your improvement over time"
                  />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleWelcomeDialogClose} color="inherit">Close</Button>
              <Button 
                variant="contained" 
                onClick={handleStartFirstSession} 
                startIcon={<MicIcon />}
              >
                Start First Session
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Success Snackbar */}
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={6000} 
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={snackbarSeverity} 
              sx={{ 
                width: '100%',
                boxShadow: theme.shadows[3]
              }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
      
      {/* Global loading overlay */}
      {authLoading && (
        <LoadingScreen 
          isLoading={true}
          fullScreen={true}
          message="Loading your profile..."
          transparent={true}
        />
      )}
    </>
  );
};

export default AppLayout;
