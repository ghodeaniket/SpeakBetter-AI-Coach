import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Breadcrumbs, 
  Link, 
  Stepper, 
  Step, 
  StepLabel,
  Button,
  CircularProgress 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PracticeTypeSelector, GuidedReading, QASimulation } from '..';
import { useAuth } from '../../../shared/contexts/AuthContext';

type PracticeType = 'freestyle' | 'guided' | 'qa';

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams<{ type?: string }>();
  const { currentUser, userProfile, isLoading: profileLoading } = useAuth();
  
  // Active step in practice flow
  const [activeStep, setActiveStep] = useState(0);
  
  // Selected practice type
  const [practiceType, setPracticeType] = useState<PracticeType>('freestyle');
  
  // Effect to set practice type from URL parameter
  useEffect(() => {
    if (type) {
      // Validate and set practice type
      if (['freestyle', 'guided', 'qa'].includes(type)) {
        setPracticeType(type as PracticeType);
        
        // If type is directly specified, skip to content selection
        if (type === 'guided' || type === 'qa') {
          setActiveStep(1);
        }
      } else {
        // Invalid practice type, redirect to main practice page
        navigate('/practice');
      }
    }
  }, [type, navigate]);
  
  // Handle practice type selection
  const handlePracticeTypeSelect = (selectedType: PracticeType) => {
    setPracticeType(selectedType);
    
    // If freestyle, skip content selection
    if (selectedType === 'freestyle') {
      // Navigate directly to speech analyzer for freestyle practice
      navigate('/speech-analysis?type=freestyle');
    } else {
      // For guided or qa, proceed to content selection
      setActiveStep(1);
      // Update URL to reflect practice type
      navigate(`/practice/${selectedType}`);
    }
  };
  
  // Handle navigation back to home
  const handleBackToHome = () => {
    navigate('/');
  };
  
  // Handle back button
  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      navigate('/practice');
    } else {
      navigate('/');
    }
  };
  
  // Steps in the practice flow
  const steps = [
    { label: 'Select Practice Type', completed: activeStep > 0 },
    { label: 'Choose Content', completed: activeStep > 1 },
    { label: 'Practice Session', completed: false }
  ];
  
  // If profile is loading, show loading indicator
  if (profileLoading) {
    return (
      <Container>
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // If user is not logged in, show login prompt
  if (!currentUser) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Practice Session
          </Typography>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Please sign in to start a practice session
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/login', { state: { from: location } })}
              sx={{ mt: 2 }}
            >
              Sign In
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container>
      <Box sx={{ py: 4 }}>
        {/* Breadcrumb navigation */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={handleBackToHome}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <FitnessCenterIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Practice Session
          </Typography>
        </Breadcrumbs>
        
        {/* Back button (only show when not on first step) */}
        {activeStep > 0 && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
        )}
        
        <Typography variant="h4" component="h1" gutterBottom>
          Practice Session
        </Typography>
        
        {/* Stepper for practice flow */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((step, index) => (
              <Step key={step.label} completed={step.completed}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        {/* Step content */}
        <Box sx={{ mb: 4 }}>
          {activeStep === 0 && (
            <PracticeTypeSelector onSelectType={handlePracticeTypeSelect} />
          )}
          
          {activeStep === 1 && practiceType === 'guided' && (
            <GuidedReading />
          )}
          
          {activeStep === 1 && practiceType === 'qa' && (
            <QASimulation />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default PracticePage;
