import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  Grid, 
  Divider, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  Chip,
  Container,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@speakbetter/state';
import { AuthService } from '@speakbetter/core';

interface ProfileProps {
  authService: AuthService;
  firestoreService: any; // Replace with proper type
}

const Profile: React.FC<ProfileProps> = ({ authService, firestoreService }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Placeholder for form state
  const [voicePreference, setVoicePreference] = useState('female');
  const [coachStyle, setCoachStyle] = useState('supportive');
  const [focusAreas, setFocusAreas] = useState(['pace', 'fillers']);
  
  // Placeholder for available focus areas
  const availableFocusAreas = [
    { id: 'pace', label: 'Speaking Pace' },
    { id: 'fillers', label: 'Filler Words' },
    { id: 'clarity', label: 'Speech Clarity' },
    { id: 'confidence', label: 'Confidence' },
    { id: 'structure', label: 'Speech Structure' },
    { id: 'engagement', label: 'Audience Engagement' },
  ];
  
  // Placeholder for toggling focus areas
  const toggleFocusArea = (areaId: string) => {
    if (focusAreas.includes(areaId)) {
      setFocusAreas(focusAreas.filter(id => id !== areaId));
    } else {
      setFocusAreas([...focusAreas, areaId]);
    }
  };
  
  // Placeholder for sign out
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        Your Profile
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar 
                src={user?.photoURL || undefined} 
                alt={user?.displayName || 'User'} 
                sx={{ width: 80, height: 80, mb: 2 }}
              />
              <Typography variant="h2" gutterBottom>
                {user?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {user?.email || ''}
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={handleSignOut}
                sx={{ mt: 2 }}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Preferences
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">AI Coach Voice</FormLabel>
                  <RadioGroup
                    row
                    value={voicePreference}
                    onChange={(e) => setVoicePreference(e.target.value)}
                  >
                    <FormControlLabel value="female" control={<Radio />} label="Female" />
                    <FormControlLabel value="male" control={<Radio />} label="Male" />
                    <FormControlLabel value="neutral" control={<Radio />} label="Neutral" />
                  </RadioGroup>
                </FormControl>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Coaching Style</FormLabel>
                  <RadioGroup
                    row
                    value={coachStyle}
                    onChange={(e) => setCoachStyle(e.target.value)}
                  >
                    <FormControlLabel value="supportive" control={<Radio />} label="Supportive" />
                    <FormControlLabel value="direct" control={<Radio />} label="Direct" />
                    <FormControlLabel value="analytical" control={<Radio />} label="Analytical" />
                  </RadioGroup>
                </FormControl>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h2" gutterBottom>
                Focus Areas
              </Typography>
              
              <Typography variant="body2" gutterBottom color="textSecondary">
                Select the areas you want to focus on improving (2-4 recommended)
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {availableFocusAreas.map(area => (
                  <Chip
                    key={area.id}
                    label={area.label}
                    clickable
                    color={focusAreas.includes(area.id) ? 'primary' : 'default'}
                    onClick={() => toggleFocusArea(area.id)}
                    variant={focusAreas.includes(area.id) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="primary">
                  Save Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
