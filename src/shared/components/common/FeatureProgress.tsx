import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Paper,
  Tooltip,
  ButtonBase
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface FeatureStepProps {
  label: string;
  description?: string;
  status: 'locked' | 'unlocked' | 'inProgress' | 'completed';
  progress?: number;
  isActive?: boolean;
  onClick?: () => void;
}

interface FeatureProgressProps {
  steps: FeatureStepProps[];
  activeStep?: number;
  title?: string;
  onStepClick?: (index: number) => void;
}

const StepContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const FeatureProgress: React.FC<FeatureProgressProps> = ({
  steps,
  activeStep = 0,
  title = 'Progress Roadmap',
  onStepClick
}) => {
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'locked':
        return <LockIcon fontSize="small" />;
      case 'unlocked':
        return <LockOpenIcon fontSize="small" />;
      case 'inProgress':
        return <ArrowForwardIcon fontSize="small" />;
      case 'completed':
        return <CheckCircleOutlineIcon fontSize="small" />;
      default:
        return null;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked':
        return 'default';
      case 'unlocked':
        return 'primary';
      case 'inProgress':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Handle step click
  const handleStepClick = (index: number, status: string) => {
    if (status !== 'locked' && onStepClick) {
      onStepClick(index);
    }
  };
  
  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      
      {steps.map((step, index) => (
        <ButtonBase
          key={index}
          component="div"
          sx={{ 
            display: 'block', 
            width: '100%',
            textAlign: 'left',
            cursor: step.status === 'locked' ? 'default' : 'pointer'
          }}
          onClick={() => handleStepClick(index, step.status)}
          disabled={step.status === 'locked'}
        >
          <StepContainer 
            elevation={index === activeStep ? 2 : 1}
            sx={{
              borderLeft: '4px solid',
              borderColor: index === activeStep ? 'primary.main' : 'divider',
              opacity: step.status === 'locked' ? 0.7 : 1,
              bgcolor: index === activeStep ? 'primaryLighter.main' : 'background.paper',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  flexGrow: 1,
                  fontWeight: index === activeStep ? 'bold' : 'medium'
                }}
              >
                {step.label}
              </Typography>
              
              <Chip
                icon={getStatusIcon(step.status)}
                label={step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                color={getStatusColor(step.status) as any}
                size="small"
                variant="outlined"
              />
            </Stack>
            
            {step.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {step.description}
              </Typography>
            )}
            
            {step.progress !== undefined && step.status === 'inProgress' && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={step.progress} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {step.progress}% complete
                </Typography>
              </Box>
            )}
          </StepContainer>
        </ButtonBase>
      ))}
    </Box>
  );
};

export default FeatureProgress;
