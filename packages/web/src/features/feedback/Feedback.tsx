import React from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Paper, Container } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

interface FeedbackProps {
  firestoreService: any; // Replace with proper type
}

const Feedback: React.FC<FeedbackProps> = ({ firestoreService }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // In a real implementation, fetch session and feedback data
  // const [sessionData, setSessionData] = useState(null);
  // const [feedbackData, setFeedbackData] = useState(null);
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        Speech Feedback
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2
                  }}
                >
                  AI
                </Box>
                <Typography variant="h2">
                  AI Coach Feedback
                </Typography>
              </Box>
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(74, 85, 162, 0.05)', borderRadius: 2, mb: 3 }}>
                <Typography variant="body1" paragraph>
                  <strong>Great job with your speaking pace!</strong> You maintained a comfortable rate of 135 words per minute, which is ideal for clear communication.
                </Typography>
                <Typography variant="body1" paragraph>
                  I noticed you used several filler words like "um" and "like" (8.2% of your total words). Try replacing these with brief pauses to sound more confident and polished.
                </Typography>
                <Typography variant="body1">
                  Your speech had good structure, but transitions between ideas could be smoother. Consider using phrases like "Next, I'd like to discuss..." or "Another important point is..." to guide your listeners.
                </Typography>
              </Paper>
              
              <Button variant="outlined" startIcon={<PlayIcon />} sx={{ mb: 3 }}>
                Listen to AI feedback
              </Button>
              
              <Typography variant="h3" gutterBottom>
                Transcript
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2">
                  So, <mark style={{ backgroundColor: '#FFECB3' }}>um</mark>, today I want to talk about effective communication in the workplace. <mark style={{ backgroundColor: '#FFECB3' }}>Like</mark>, it's really important to be clear when you're talking to colleagues. I think that, <mark style={{ backgroundColor: '#FFECB3' }}>you know</mark>, misunderstandings can cause a lot of problems in teams. When you're presenting ideas, it's <mark style={{ backgroundColor: '#FFECB3' }}>um</mark>, critical to structure your thoughts beforehand. <mark style={{ backgroundColor: '#FFECB3' }}>So</mark>, I always try to prepare an outline before important meetings...
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Your Metrics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Speaking Pace
                    </Typography>
                    <Typography variant="h3">
                      135 WPM
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +5% improvement
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Filler Words
                    </Typography>
                    <Typography variant="h3">
                      8.2%
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      -3% from goal
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Clarity Score
                    </Typography>
                    <Typography variant="h3">
                      82/100
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +7 points
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="h3">
                      1:45
                    </Typography>
                    <Typography variant="body2">
                      minutes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              sx={{ flex: 1 }}
              onClick={() => navigate('/practice')}
            >
              Try Again
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ flex: 1 }}
              onClick={() => navigate('/')}
            >
              Dashboard
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

// Simple Play icon placeholder
const PlayIcon = () => (
  <Box
    component="svg"
    sx={{
      width: 24,
      height: 24,
      fill: 'currentColor'
    }}
    viewBox="0 0 24 24"
  >
    <path d="M8 5v14l11-7z" />
  </Box>
);

export default Feedback;
