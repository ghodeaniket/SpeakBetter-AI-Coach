import React, { useState } from 'react';
import { 
  Typography, Box, Paper, FormControl, InputLabel, Select, MenuItem, 
  FormGroup, FormControlLabel, Checkbox, Button, Grid, Divider,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useUserProfile } from '../../../shared/hooks/useUserProfile';
import { UserSettings } from '../../../types/userProfile';

const UserPreferences: React.FC = () => {
  const { userProfile, updateSettings } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const [settings, setSettings] = useState<UserSettings>(
    userProfile?.settings || {
      selectedVoice: 'female',
      coachPersonality: 'supportive',
      notificationPreferences: {
        email: true,
        inApp: true,
        practiceDays: ['monday', 'wednesday', 'friday']
      }
    }
  );
  
  const voiceOptions = [
    { value: 'female', label: 'Female Voice' },
    { value: 'male', label: 'Male Voice' },
    { value: 'en-US-Standard-I', label: 'Professional Female (US)' },
    { value: 'en-US-Standard-D', label: 'Professional Male (US)' },
    { value: 'en-GB-Standard-A', label: 'British Female' },
    { value: 'en-GB-Standard-B', label: 'British Male' }
  ];
  
  const personalityOptions = [
    { value: 'supportive', label: 'Supportive & Encouraging' },
    { value: 'direct', label: 'Direct & Straightforward' },
    { value: 'analytical', label: 'Analytical & Detailed' },
    { value: 'casual', label: 'Casual & Friendly' }
  ];
  
  const weekdays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];
  
  const handleVoiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSettings(prev => ({
      ...prev,
      selectedVoice: event.target.value as string
    }));
  };
  
  const handlePersonalityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSettings(prev => ({
      ...prev,
      coachPersonality: event.target.value as string
    }));
  };
  
  const handleEmailNotificationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        email: event.target.checked
      }
    }));
  };
  
  const handleInAppNotificationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        inApp: event.target.checked
      }
    }));
  };
  
  const handleDayChange = (day: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { practiceDays } = settings.notificationPreferences;
    let newPracticeDays: string[];
    
    if (event.target.checked) {
      newPracticeDays = [...practiceDays, day];
    } else {
      newPracticeDays = practiceDays.filter(d => d !== day);
    }
    
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        practiceDays: newPracticeDays
      }
    }));
  };
  
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateSettings(settings);
      setNotification({
        message: 'Preferences saved successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setNotification({
        message: 'Failed to save preferences',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification(null);
  };

  if (!userProfile) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Coaching Preferences
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            AI Coach Voice & Personality
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="voice-select-label">Coach Voice</InputLabel>
            <Select
              labelId="voice-select-label"
              value={settings.selectedVoice}
              onChange={handleVoiceChange}
              label="Coach Voice"
            >
              {voiceOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="personality-select-label">Coach Personality</InputLabel>
            <Select
              labelId="personality-select-label"
              value={settings.coachPersonality}
              onChange={handlePersonalityChange}
              label="Coach Personality"
            >
              {personalityOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Notification Preferences
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={settings.notificationPreferences.email} 
                  onChange={handleEmailNotificationsChange}
                />
              }
              label="Email Reminders"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={settings.notificationPreferences.inApp} 
                  onChange={handleInAppNotificationsChange}
                />
              }
              label="In-App Notifications"
            />
          </FormGroup>
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Practice Reminder Days
          </Typography>
          
          <FormGroup row>
            {weekdays.map(day => (
              <FormControlLabel
                key={day.value}
                control={
                  <Checkbox 
                    checked={settings.notificationPreferences.practiceDays.includes(day.value)} 
                    onChange={handleDayChange(day.value)}
                    size="small"
                  />
                }
                label={day.label}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save Preferences'}
        </Button>
      </Box>
      
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert onClose={handleCloseNotification} severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Paper>
  );
};

export default UserPreferences;
