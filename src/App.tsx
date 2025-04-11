import React, { useState, useEffect } from 'react';
import { Alert, Box, Button, Container, Paper, Typography, Snackbar, ThemeProvider, GlobalStyles as MuiGlobalStyles, CircularProgress } from '@mui/material';
import Routes from './shared/routes/Routes';
import { AuthProvider } from './shared/contexts/AuthContext';
import { SpeechProvider } from './shared/contexts/SpeechContext';
import { UserProfileProvider } from './shared/contexts/UserProfileContext';
import OfflineIndicator from './shared/components/OfflineIndicator';
import globalStyles from './shared/theme/globalStyles';
import theme from './shared/theme';

/**
 * Error boundary component to catch any uncaught errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              mt: 4,
              p: 4,
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body1" paragraph>
              We're sorry, but an unexpected error has occurred.
            </Typography>
            {this.state.error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {this.state.error.message}
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
            >
              Return to Dashboard
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Main application component
 * Wraps the entire app with the AuthProvider and ErrorBoundary
 * Uses the Routes component to handle navigation
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <MuiGlobalStyles styles={globalStyles(theme)} />
      <ErrorBoundary>
        <AuthProvider>
          <UserProfileProvider>
            <SpeechProvider>
              <AppContent />
            </SpeechProvider>
          </UserProfileProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

// Create a context for the help system
export const HelpContext = React.createContext<{
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  helpTopic: string;
  setHelpTopic: (topic: string) => void;
}>({
  showHelp: false,
  setShowHelp: () => {},
  helpTopic: '',
  setHelpTopic: () => {},
});

// Custom hook to use the help context
export const useHelp = () => React.useContext(HelpContext);

/**
 * App content component with network status monitoring and help system
 */
const AppContent: React.FC = () => {
  const [firestoreConnectionError, setFirestoreConnectionError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTopic, setHelpTopic] = useState('');

  // Monitor network status
  useEffect(() => {
    // Initial connection test
    testFirebaseConnection();
  }, []);

  // Test Firebase connection
  const testFirebaseConnection = async () => {
    try {
      // Only test connection if we're online
      if (navigator.onLine) {
        const { checkFirestoreConnection } = await import('./firebase/config');
        const isConnected = await checkFirestoreConnection();
        
        if (!isConnected) {
          console.warn('Firestore connection test failed');
          setFirestoreConnectionError(true);
        } else {
          setFirestoreConnectionError(false);
        }
      }
    } catch (error) {
      console.error('Error testing Firebase connection:', error);
      setFirestoreConnectionError(true);
    }
  };

  return (
    <>
      <HelpContext.Provider value={{ showHelp, setShowHelp, helpTopic, setHelpTopic }}>
        <Routes />
        
        {/* Global Offline Indicator that will handle network status alerts */}
        <OfflineIndicator
          onStatusChange={(isOnline) => {
            if (isOnline) {
              // Test Firebase connection when coming online
              testFirebaseConnection();
            }
          }}
        />
      </HelpContext.Provider>
      
      {/* Firestore connection error alert */}
      <Snackbar
        open={firestoreConnectionError}
        autoHideDuration={10000}
        onClose={() => setFirestoreConnectionError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => setFirestoreConnectionError(false)}
          sx={{ width: '100%' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                testFirebaseConnection();
              }}
            >
              Retry
            </Button>
          }
        >
          Unable to connect to database. Some features may not work properly.
        </Alert>
      </Snackbar>
    </>
  );
};

export default App;
