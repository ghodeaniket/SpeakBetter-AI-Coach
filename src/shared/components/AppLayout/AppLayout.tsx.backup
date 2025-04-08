import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
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
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { SpeechProvider } from '../../contexts/SpeechContext';

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

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  const drawerWidth = 240;

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const closeDrawer = () => {
    if (isMobile) {
      setDrawerOpen(false);
    }
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
      text: 'AI Coach Feedback',
      icon: <VoiceChatIcon />,
      path: '/text-to-speech',
    },
  ];

  const drawer = (
    <Box>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              onClick={closeDrawer}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <SpeechProvider>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
              
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                SpeakBetter AI Coach
              </Typography>
              
              <IconButton 
                color="inherit" 
                aria-label="start practice"
                component={Link}
                to="/speech-to-text"
              >
                <MicIcon />
              </IconButton>
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
              ml: { md: `${drawerWidth}px` }
            }}
          >
            <Toolbar />
            {children}
          </Box>
        </Box>
      </SpeechProvider>
    </ThemeProvider>
  );
};

export default AppLayout;
