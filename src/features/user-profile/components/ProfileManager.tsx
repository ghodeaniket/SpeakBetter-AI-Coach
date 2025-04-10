import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Avatar, TextField, Button, CircularProgress, Divider, Snackbar, Alert } from '@mui/material';
import { useUserProfile } from '../../../shared/hooks/useUserProfile';
import GoalSetting from './GoalSetting';
import UserPreferences from './UserPreferences';

const ProfileManager: React.FC = () => {
  const { userProfile, loading, error, updateProfile } = useUserProfile();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">Error loading profile: {error.message}</Typography>
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>You need to be signed in to view your profile.</Typography>
      </Box>
    );
  }

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ displayName });
      setNotification({
        message: 'Profile updated successfully',
        type: 'success'
      });
    } catch (err) {
      setNotification({
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Your Profile
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            src={userProfile.photoURL || undefined}
            alt={userProfile.displayName}
            sx={{ width: 80, height: 80, mr: 3 }}
          />
          <Box>
            <Typography variant="h6">{userProfile.displayName || 'User'}</Typography>
            <Typography color="textSecondary">{userProfile.email}</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        
        <TextField
          fullWidth
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleProfileUpdate} 
          disabled={isSaving}
          sx={{ mt: 2 }}
        >
          {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Paper>
      
      <GoalSetting />
      
      <UserPreferences />
      
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert onClose={handleCloseNotification} severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Container>
  );
};

export default ProfileManager;
