import React from 'react';
import { Box, Typography, Button, Card, CardContent, Container } from '@mui/material';
import { AuthService } from '@speakbetter/core';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginProps {
  authService: AuthService;
}

const Login: React.FC<LoginProps> = ({ authService }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, or default to home
  const from = (location.state as any)?.from?.pathname || '/';
  
  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
      // Redirect will happen automatically due to the auth state change
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h1" align="center" gutterBottom>
            Welcome to SpeakBetter
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 4 }}>
            Sign in to access your AI speech coach and improve your communication skills.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleGoogleSignIn}
              startIcon={<GoogleIcon />}
              sx={{ 
                py: 1.5, 
                px: 3,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Continue with Google
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

// Simple Google icon placeholder
const GoogleIcon = () => (
  <Box
    component="svg"
    sx={{
      width: 24,
      height: 24,
      fill: 'currentColor'
    }}
    viewBox="0 0 24 24"
  >
    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
  </Box>
);

export default Login;
