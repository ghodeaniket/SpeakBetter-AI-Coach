import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ButtonBase,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SvgIconComponent } from '@mui/icons-material';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  featured?: boolean;
}

// Styled components for better aesthetics
const ActionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
  position: 'relative',
  overflow: 'hidden',
}));

const CardContainer = styled(ButtonBase)(({ theme }) => ({
  display: 'block',
  textAlign: 'left',
  width: '100%',
  height: '100%',
  transition: 'background-color 0.3s ease',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

// Background decoration element
const BackgroundDecoration = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: -20,
  bottom: -20,
  width: 140,
  height: 140,
  borderRadius: '50%',
  opacity: 0.1,
  zIndex: 0,
}));

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  disabled = false,
  featured = false
}) => {
  const theme = useTheme();
  
  return (
    <ActionCard 
      elevation={featured ? 2 : 1} 
      sx={{ 
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        border: featured ? `1px solid ${theme.palette.primary.main}` : undefined,
      }}
    >
      {/* Background decoration circle */}
      <BackgroundDecoration 
        sx={{ 
          bgcolor: featured ? 'primary.main' : 'secondary.main'
        }} 
      />
      
      <CardContainer 
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        component="div"
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 1.5
            }}
          >
            <Box 
              sx={{ 
                mr: 1.5,
                color: featured ? 'primary.main' : 'secondary.main',
                display: 'flex',
              }}
            >
              {icon}
            </Box>
            <Typography 
              variant="h6" 
              component="h3"
              color={featured ? 'primary.main' : 'text.primary'}
            >
              {title}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          
          {featured && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'primary.main',
                color: 'white',
                py: 0.5,
                px: 1.5,
                borderBottomLeftRadius: theme.shape.borderRadius,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              Recommended
            </Box>
          )}
        </CardContent>
      </CardContainer>
    </ActionCard>
  );
};

export default QuickActionCard;
