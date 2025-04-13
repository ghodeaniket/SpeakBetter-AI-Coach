import React from 'react';
import { Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  firestoreService: any; // Replace with proper type
}

const Dashboard: React.FC<DashboardProps> = ({ firestoreService }) => {
  const navigate = useNavigate();

  // Placeholder for handling practice button click
  const handleStartPractice = () => {
    navigate('/practice');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Card sx={{ mb: 4, bgcolor: 'rgba(74, 85, 162, 0.05)' }}>
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Your Progress
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">Sessions Completed</Typography>
              <Typography variant="h3">5</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">Average Speaking Rate</Typography>
              <Typography variant="h3">135 WPM</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">Filler Word Reduction</Typography>
              <Typography variant="h3">-15%</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">Clarity Score</Typography>
              <Typography variant="h3">85/100</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleStartPractice}
        >
          Start New Practice
        </Button>
      </Box>
      
      <Typography variant="h2" gutterBottom>
        Recent Sessions
      </Typography>
      
      <Grid container spacing={2}>
        {/* Placeholder for session cards - would be populated from Firestore */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3">Freestyle Practice</Typography>
              <Typography variant="body2">April 5, 2025 • 2 min</Typography>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/feedback/session1')}
                >
                  View Feedback
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3">Interview Prep</Typography>
              <Typography variant="body2">April 3, 2025 • 3 min</Typography>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/feedback/session2')}
                >
                  View Feedback
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
