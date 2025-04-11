import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Box, Typography, useTheme } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import useOfflineDetection from '../../hooks/useOfflineDetection';

interface OfflineIndicatorProps {
  /** Optional callback to be called when online/offline status changes */
  onStatusChange?: (isOnline: boolean) => void;
  /** Whether to show a persistent indicator (not just a snackbar) */
  showPersistentIndicator?: boolean;
}

/**
 * Component that shows an indicator when the user is offline
 * Can display both a snackbar notification and optionally a persistent indicator
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onStatusChange,
  showPersistentIndicator = false,
}) => {
  const { isOnline, isOffline } = useOfflineDetection();
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const theme = useTheme();

  // Show snackbar when status changes
  useEffect(() => {
    if (isOffline) {
      setSnackbarMessage('You are offline. Some features may be limited.');
      setShowSnackbar(true);
    } else if (!isOffline && showSnackbar) {
      setSnackbarMessage('You are back online!');
      setShowSnackbar(true);
      
      // Auto-hide the "back online" message after 3 seconds
      const timer = setTimeout(() => {
        setShowSnackbar(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Call the callback if provided
    if (onStatusChange) {
      onStatusChange(isOnline);
    }
  }, [isOffline, isOnline, onStatusChange, showSnackbar]);

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <>
      {/* Persistent indicator */}
      {showPersistentIndicator && isOffline && (
        <Box
          sx={{
            position: 'fixed',
            top: theme.spacing(1),
            right: theme.spacing(1),
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            padding: theme.spacing(0.5, 1),
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[2],
          }}
        >
          <WifiOffIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight="medium">
            Offline Mode
          </Typography>
        </Box>
      )}

      {/* Status change snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={isOffline ? null : 3000} // Keep open when offline
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={isOffline ? 'warning' : 'success'} 
          variant="filled"
          onClose={handleSnackbarClose}
          icon={isOffline ? <WifiOffIcon /> : undefined}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;
