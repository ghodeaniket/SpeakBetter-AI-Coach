import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar, 
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import { Achievement } from '../../../services/firebase/userMetrics';

// Helper function to format dates instead of using date-fns
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
};

interface AchievementCardProps {
  achievement: Achievement;
  isNew?: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, isNew = false }) => {
  const theme = useTheme();
  
  // Format the achievement date
  const formattedDate = formatTimeAgo(achievement.achievedAt.toDate());

  return (
    <Card 
      sx={{ 
        display: 'flex', 
        p: 1, 
        boxShadow: isNew ? 3 : 1,
        borderLeft: isNew ? `4px solid ${theme.palette.primary.main}` : 'none',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2
        }
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          p: 1
        }}
      >
        <Avatar 
          src={achievement.iconPath} 
          alt={achievement.title}
          sx={{ 
            width: 60, 
            height: 60,
            bgcolor: theme.palette.primary.light
          }}
        />
      </Box>
      
      <CardContent sx={{ flex: '1 0 auto', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography component="div" variant="subtitle1" fontWeight="bold">
            {achievement.title}
          </Typography>
          
          {isNew && (
            <Tooltip title="New achievement!">
              <Chip 
                label="New!" 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20 }}
              />
            </Tooltip>
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {achievement.description}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Earned {formattedDate}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;
