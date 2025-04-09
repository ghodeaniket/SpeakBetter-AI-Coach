import React from 'react';
import {
  Alert,
  AlertTitle,
  Paper,
  Typography,
  Button,
  Box,
  Collapse,
  IconButton,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface ErrorDisplayProps {
  error: Error | string | null;
  retryAction?: () => void;
  dismissAction?: () => void;
  title?: string;
  variant?: 'alert' | 'card' | 'inline';
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  retryAction,
  dismissAction,
  title = 'An error occurred',
  variant = 'alert',
  severity = 'error',
  showDetails = false
}) => {
  const [expanded, setExpanded] = React.useState(showDetails);
  
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorDetails = typeof error === 'string' ? null : error.stack;
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Render as an Alert component
  if (variant === 'alert') {
    return (
      <Alert
        severity={severity}
        action={
          <Box>
            {dismissAction && (
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={dismissAction}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            )}
            {retryAction && (
              <IconButton
                aria-label="retry"
                color="inherit"
                size="small"
                onClick={retryAction}
              >
                <RefreshIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        }
        sx={{ mb: 2 }}
      >
        <AlertTitle>{title}</AlertTitle>
        {errorMessage}
        
        {errorDetails && (
          <>
            <Button
              size="small"
              color="inherit"
              sx={{ mt: 1, textTransform: 'none' }}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={toggleExpanded}
            >
              {expanded ? 'Hide' : 'Show'} details
            </Button>
            
            <Collapse in={expanded}>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: 'rgba(0,0,0,0.05)',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {errorDetails}
              </Box>
            </Collapse>
          </>
        )}
      </Alert>
    );
  }
  
  // Render as a card with more details
  if (variant === 'card') {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderLeft: `4px solid ${
            severity === 'error'
              ? 'error.main'
              : severity === 'warning'
              ? 'warning.main'
              : 'info.main'
          }`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <ErrorOutlineIcon
            color={severity}
            sx={{ mr: 1, fontSize: 24, mt: 0.5 }}
          />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {errorMessage}
            </Typography>
          </Box>
          
          {dismissAction && (
            <IconButton
              aria-label="close"
              size="small"
              onClick={dismissAction}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        {errorDetails && (
          <>
            <Button
              size="small"
              color={severity}
              sx={{ textTransform: 'none' }}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={toggleExpanded}
            >
              {expanded ? 'Hide' : 'Show'} technical details
            </Button>
            
            <Collapse in={expanded}>
              <Box
                component="pre"
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {errorDetails}
              </Box>
            </Collapse>
          </>
        )}
        
        {retryAction && (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              color={severity}
              size="small"
              startIcon={<RefreshIcon />}
              onClick={retryAction}
            >
              Try Again
            </Button>
          </>
        )}
      </Paper>
    );
  }
  
  // Render as a simple inline message
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        color: severity === 'error' ? 'error.main' : severity === 'warning' ? 'warning.main' : 'info.main',
        my: 1
      }}
    >
      <ErrorOutlineIcon fontSize="small" sx={{ mr: 1 }} />
      <Typography variant="body2">{errorMessage}</Typography>
      {retryAction && (
        <Button
          color={severity}
          size="small"
          startIcon={<RefreshIcon />}
          onClick={retryAction}
          sx={{ ml: 2, minWidth: 'auto' }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
};

export default ErrorDisplay;
