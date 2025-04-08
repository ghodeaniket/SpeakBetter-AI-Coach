import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Avatar,
  Alert,
  Link as MuiLink
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { LoginButton } from '../components';
import { useAuth } from '../../../shared/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { currentUser, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (currentUser && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [currentUser, isLoading, navigate, from]);
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Sign in to SpeakBetter
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Access your speech practice sessions and get personalized AI coaching
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error.message}
            </Alert>
          )}
          
          <Stack spacing={2} sx={{ width: '100%' }}>
            <LoginButton 
              fullWidth 
              variant="contained" 
              size="large"
              onLoginSuccess={() => navigate(from, { replace: true })}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              By signing in, you agree to our{' '}
              <MuiLink href="#" underline="hover">
                Terms of Service
              </MuiLink>{' '}
              and{' '}
              <MuiLink href="#" underline="hover">
                Privacy Policy
              </MuiLink>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
