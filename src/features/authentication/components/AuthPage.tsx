import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AuthPage: React.FC = () => {
  const theme = useTheme();
  const { signInWithGoogle, isLoading, error } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  
  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setActiveStep(1); // Move to loading step
    try {
      const user = await signInWithGoogle();
      if (user) {
        setActiveStep(2); // Move to success step
      } else {
        setActiveStep(0); // Return to initial step on error
      }
    } catch (error) {
      setActiveStep(0); // Return to initial step on error
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo or app name */}
        <Typography
          variant="h4"
          component="h1"
          color="primary.main"
          fontWeight="bold"
          sx={{ mb: 1 }}
        >
          SpeakBetter
        </Typography>
        
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ mb: 4, textAlign: 'center' }}
        >
          AI-powered speech coaching to improve your communication skills
        </Typography>
        
        {/* Stepper for onboarding */}
        <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
          <Step>
            <StepLabel>Sign In</StepLabel>
          </Step>
          <Step>
            <StepLabel>Set Goals</StepLabel>
          </Step>
          <Step>
            <StepLabel>Start Practicing</StepLabel>
          </Step>
        </Stepper>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error.message}
          </Alert>
        )}
        
        {/* Sign in options */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sign in to get started
          </Typography>
          
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            sx={{
              py: 1.5,
              textTransform: 'none',
              borderRadius: 2,
              justifyContent: 'flex-start',
              px: 3,
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Signing in...
              </>
            ) : (
              'Continue with Google'
            )}
          </Button>
        </Box>
        
        <Divider sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Why Sign In?
          </Typography>
        </Divider>
        
        {/* Benefits of signing in */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                color: 'primary.contrastText',
                fontWeight: 'bold',
              }}
            >
              1
            </Box>
            <Typography variant="body1">
              Track your progress over time
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                color: 'primary.contrastText',
                fontWeight: 'bold',
              }}
            >
              2
            </Box>
            <Typography variant="body1">
              Save your practice sessions and results
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                color: 'primary.contrastText',
                fontWeight: 'bold',
              }}
            >
              3
            </Box>
            <Typography variant="body1">
              Get personalized improvement suggestions
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Typography>
      </Box>
    </Container>
  );
};

export default AuthPage;
