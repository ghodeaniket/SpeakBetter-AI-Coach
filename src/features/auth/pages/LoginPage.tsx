import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Link as MuiLink,
  Grid,
  useTheme,
  useMediaQuery,
  Divider,
  Button
} from '@mui/material';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MicIcon from '@mui/icons-material/Mic';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { LoginButton, AuthErrorDisplay } from '../components';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ErrorDisplay, LoadingScreen } from '../../../shared/components/common';

/**
 * Login page component that displays a login form and application benefits
 */
const LoginPage: React.FC = () => {
  const { currentUser, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get return URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (currentUser && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [currentUser, isLoading, navigate, from]);
  
  // Benefits list
  const benefits = [
    {
      icon: <MicIcon fontSize="medium" />,
      title: "Record Your Voice",
      description: "Practice speaking on any topic with our easy-to-use recording tool"
    },
    {
      icon: <BarChartIcon fontSize="medium" />,
      title: "Analyze Speech Patterns",
      description: "Get detailed analysis of your speaking pace, filler words, and clarity"
    },
    {
      icon: <SettingsVoiceIcon fontSize="medium" />,
      title: "Receive AI Feedback",
      description: "Get personalized coaching from our advanced AI assistant"
    },
    {
      icon: <CheckCircleOutlineIcon fontSize="medium" />,
      title: "Track Your Progress",
      description: "Monitor your improvement over time with detailed metrics"
    }
  ];
  
  // If loading, show loading indicator
  if (isLoading) {
    return <LoadingScreen isLoading={true} fullScreen={true} message="Checking authentication status..." />;
  }
  
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'background.default',
      background: 'linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)'
    }}>
      <Container 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4
        }}
      >
        {/* For desktop: two columns side by side */}
        {!isMobile && (
          <Grid container spacing={4} sx={{ width: '100%' }}>
            {/* Login column */}
            <Grid item xs={12} md={5} lg={4}>
              <LoginCard 
                error={error} 
                onLoginSuccess={() => navigate(from, { replace: true })} 
              />
            </Grid>
            
            {/* Benefits column */}
            <Grid item xs={12} md={7} lg={8}>
              <BenefitsSection benefits={benefits} isMobile={isMobile} />
            </Grid>
          </Grid>
        )}
        
        {/* For mobile: stacked layout */}
        {isMobile && (
          <Stack spacing={4} sx={{ width: '100%' }}>
            <LoginCard 
              error={error} 
              onLoginSuccess={() => navigate(from, { replace: true })} 
            />
            <BenefitsSection benefits={benefits} isMobile={isMobile} />
          </Stack>
        )}
      </Container>
    </Box>
  );
};

// Login card component
interface LoginCardProps {
  error: Error | null;
  onLoginSuccess: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ error, onLoginSuccess }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4
        }}
      >
        <Box 
          sx={{ 
            bgcolor: 'primary.main',
            width: 48,
            height: 48,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5
          }}
        >
          <RecordVoiceOverIcon sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Typography component="h1" variant="h4" fontWeight="bold" color="primary.main">
          SpeakBetter
        </Typography>
      </Box>
      
      <Typography variant="h5" fontWeight="medium" align="center" gutterBottom>
        Welcome Back
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Sign in to access your speech practice sessions and analytics
      </Typography>
      
      {error && (
        <AuthErrorDisplay 
          error={error} 
          onRetry={() => {}} 
        />
      )}
      
      <Stack spacing={3} sx={{ width: '100%', mt: 2 }}>
        <LoginButton 
          fullWidth 
          variant="contained" 
          size="large"
          onLoginSuccess={onLoginSuccess}
          sx={{ 
            py: 1.5,
            boxShadow: '0 4px 12px rgba(74, 85, 162, 0.4)'
          }}
        />
        
        <Divider>
          <Typography variant="caption" color="text.secondary">
            SECURE AUTHENTICATION
          </Typography>
        </Divider>
        
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          By signing in, you agree to our{' '}
          <MuiLink href="#" underline="hover" color="primary.main">
            Terms of Service
          </MuiLink>{' '}
          and{' '}
          <MuiLink href="#" underline="hover" color="primary.main">
            Privacy Policy
          </MuiLink>
        </Typography>
      </Stack>
    </Paper>
  );
};

// Benefits section component
interface BenefitsSectionProps {
  benefits: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  isMobile: boolean;
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits, isMobile }) => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          fontWeight="bold" 
          gutterBottom
          align={isMobile ? "center" : "left"}
        >
          Improve Your Speaking Skills
        </Typography>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="text.secondary"
          align={isMobile ? "center" : "left"}
        >
          Get AI-powered speech coaching to become a more confident and effective speaker
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {benefits.map((benefit, index) => (
          <Grid item xs={12} sm={6} key={benefit.title}>
            <Paper
              elevation={isMobile ? 2 : 1}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme => theme.shadows[4]
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box 
                  sx={{ 
                    bgcolor: '#f0f5ff',
                    color: 'primary.main',
                    borderRadius: '12px',
                    p: 1.5,
                    mr: 2
                  }}
                >
                  {benefit.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LoginPage;
