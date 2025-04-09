import React from 'react';
import { Alert, AlertTitle, Box, Button, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface AuthErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
}

/**
 * Component for displaying authentication errors with helpful debug information
 */
const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({ error, onRetry }) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!error) return null;

  const errorMessage = error.message;
  const isConfigError = errorMessage.includes('configuration-not-found');
  const isNetworkError = errorMessage.includes('network') || errorMessage.includes('timeout');
  
  let helpText = '';
  let actionText = '';
  
  if (isConfigError) {
    helpText = 'This usually means the Firebase project is not properly configured or the authentication domain is not authorized.';
    actionText = 'Check Firebase Console settings for this project.';
  } else if (isNetworkError) {
    helpText = 'There seems to be a problem with your internet connection.';
    actionText = 'Check your network and try again.';
  }

  return (
    <Box sx={{ mb: 3, width: '100%' }}>
      <Alert 
        severity="error" 
        action={
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'show less' : 'show more'}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      >
        <AlertTitle>Authentication Error</AlertTitle>
        {errorMessage}
        
        {(helpText || actionText) && (
          <Box sx={{ mt: 1 }}>
            {helpText && <Typography variant="body2">{helpText}</Typography>}
          </Box>
        )}
        
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">Troubleshooting Steps:</Typography>
            
            {isConfigError && (
              <>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  1. Verify Firebase project settings in the Firebase Console:
                  <ul>
                    <li>Ensure the Firebase project exists and is properly set up</li>
                    <li>Check that Google sign-in is enabled in Authentication → Sign-in methods</li> 
                    <li>Verify that your domain (localhost:8000) is in the authorized domains list</li>
                  </ul>
                </Typography>
                <Button 
                  startIcon={<OpenInNewIcon />} 
                  size="small" 
                  variant="outlined" 
                  href="https://console.firebase.google.com/" 
                  target="_blank"
                  sx={{ mt: 1 }}
                >
                  Open Firebase Console
                </Button>
              </>
            )}
            
            {isNetworkError && (
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                1. Check your network connection<br />
                2. Ensure your firewall isn't blocking Firebase requests<br />
                3. Try using a different network if possible
              </Typography>
            )}
            
            {!isConfigError && !isNetworkError && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                For more detailed information, check the browser console (F12) for error logs.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Alert>
      
      {onRetry && (
        <Button 
          fullWidth 
          variant="outlined" 
          onClick={onRetry} 
          sx={{ mt: 1 }}
        >
          Retry Login
        </Button>
      )}
    </Box>
  );
};

export default AuthErrorDisplay;
