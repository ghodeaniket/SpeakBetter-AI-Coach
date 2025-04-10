import React, { useState, useEffect } from 'react';
import { Alert, Box, Button, Container, Paper, Typography, Snackbar, ThemeProvider, GlobalStyles as MuiGlobalStyles, CircularProgress } from '@mui/material';
import Routes from './shared/routes/Routes';
import { AuthProvider } from './shared/contexts/AuthContext';
import { SpeechProvider } from './shared/contexts/SpeechContext';
import { UserProfileProvider } from './shared/contexts/UserProfileContext';
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

/**
 * App content component with network status monitoring
 */
const AppContent: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [firestoreConnectionError, setFirestoreConnectionError] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineAlert(true);
      // Test Firebase connection when coming online
      testFirebaseConnection();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testFirebaseConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      <Routes />
      
      {/* Network status alert */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={isOffline ? 'warning' : 'success'}
          onClose={() => setShowOfflineAlert(false)}
          sx={{ width: '100%' }}
        >
          {isOffline
            ? 'You are offline. Some features may be limited.'
            : 'You are back online!'}
        </Alert>
      </Snackbar>
      
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
