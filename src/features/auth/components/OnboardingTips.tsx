import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  Button, 
  Paper, 
  Typography,
  Divider,
  Chip,
  Collapse
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DoneIcon from '@mui/icons-material/Done';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface OnboardingTipsProps {
  expanded?: boolean;
  onDismiss?: () => void;
}

const OnboardingTips: React.FC<OnboardingTipsProps> = ({ 
  expanded = true,
  onDismiss 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [show, setShow] = useState(expanded);
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // Check if we should show onboarding tips
  useEffect(() => {
    if (userProfile) {
      const onboardingKey = `onboarding-${userProfile.uid}-completed`;
      const onboardingCompleted = localStorage.getItem(onboardingKey);
      
      if (onboardingCompleted === 'true') {
        setShow(false);
      }
    }
  }, [userProfile]);
  
  const steps = [
    {
      label: 'Record your speech',
      description: 'Start by recording a short speech sample (30s-3min) on any topic. The app will analyze your speaking patterns.',
      icon: <MicIcon color="primary" />,
      action: () => navigate('/speech-to-text')
    },
    {
      label: 'Review your analysis',
      description: 'After recording, you\'ll see a detailed breakdown of your speech, including transcription, filler words, and speaking rate.',
      icon: <RecordVoiceOverIcon color="primary" />,
      action: null
    },
    {
      label: 'Get personalized feedback',
      description: 'Use the AI Coach to receive customized feedback on your strengths and areas for improvement.',
      icon: <VoiceChatIcon color="primary" />,
      action: () => navigate('/text-to-speech')
    },
    {
      label: 'Track your progress',
      description: 'Practice regularly and watch your speaking skills improve over time with detailed metrics and visualizations.',
      icon: <TrendingUpIcon color="primary" />,
      action: null
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleComplete = () => {
    setCompleted(true);
    
    // Save completion status to localStorage
    if (userProfile) {
      localStorage.setItem(`onboarding-${userProfile.uid}-completed`, 'true');
    }
    
    // Call onDismiss callback if provided
    if (onDismiss) {
      onDismiss();
    }
    
    setShow(false);
  };

  const handleTryStep = (index: number) => {
    if (steps[index].action) {
      steps[index].action();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <Collapse in={show}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'primary.light',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Get Started with SpeakBetter
            {completed && (
              <Chip 
                icon={<DoneIcon />} 
                label="Completed" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }} 
              />
            )}
          </Typography>
          
          {!completed && (
            <Button 
              size="small" 
              onClick={handleComplete}
              color="primary"
            >
              Dismiss
            </Button>
          )}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {completed ? (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              You're all set to start improving your speaking skills!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/speech-to-text')}
              sx={{ mt: 1 }}
              startIcon={<MicIcon />}
            >
              Start Practice
            </Button>
          </Box>
        ) : (
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={() => (
                  <Box sx={{ mr: 1, display: 'inline-flex' }}>
                    {step.icon}
                  </Box>
                )}>
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                      {step.action && (
                        <Button
                          variant="outlined"
                          onClick={() => handleTryStep(index)}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Try Now
                        </Button>
                      )}
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
        
        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="body1" gutterBottom>
              All steps completed - you're ready to use SpeakBetter!
            </Typography>
            <Button 
              onClick={handleComplete} 
              sx={{ mt: 1 }} 
              variant="contained"
              color="primary"
            >
              Let's Go
            </Button>
          </Paper>
        )}
      </Paper>
    </Collapse>
  );
};

export default OnboardingTips;
