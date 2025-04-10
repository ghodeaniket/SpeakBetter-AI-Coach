import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import FlagIcon from '@mui/icons-material/Flag';
import AddIcon from '@mui/icons-material/Add';
import SpeedIcon from '@mui/icons-material/Speed';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MicIcon from '@mui/icons-material/Mic';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useUserProfile } from '../../../shared/hooks/useUserProfile';
import { UserGoal } from '../../../types/userProfile';

const UserGoalsWidget: React.FC = () => {
  const { userProfile, loading, error, hasGoals, getMostRecentGoal } = useUserProfile();

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="error">Error loading goals: {error.message}</Typography>
        </CardContent>
      </Card>
    );
  }

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'presentation':
        return <RecordVoiceOverIcon fontSize="small" />;
      case 'interview':
        return <MicIcon fontSize="small" />;
      case 'everyday':
        return <TipsAndUpdatesIcon fontSize="small" />;
      default:
        return <FlagIcon fontSize="small" />;
    }
  };

  const getGoalTypeLabel = (type: string): string => {
    switch (type) {
      case 'presentation':
        return 'Presentation Skills';
      case 'interview':
        return 'Interview Preparation';
      case 'everyday':
        return 'Everyday Communication';
      default:
        return type;
    }
  };

  const renderGoalChips = (goal: UserGoal) => {
    return goal.focus.map((focus, index) => (
      <Chip 
        key={index}
        label={getFocusAreaLabel(focus)}
        size="small"
        sx={{ mr: 0.5, mb: 0.5 }}
        color="primary"
        variant="outlined"
      />
    ));
  };

  const getFocusAreaLabel = (focus: string): string => {
    switch (focus) {
      case 'pace':
        return 'Speaking Pace';
      case 'fillers':
        return 'Filler Words';
      case 'clarity':
        return 'Articulation';
      case 'confidence':
        return 'Confidence';
      case 'structure':
        return 'Structure';
      default:
        return focus;
    }
  };

  const mostRecentGoal = getMostRecentGoal();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FlagIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Your Speaking Goals</Typography>
        </Box>

        {hasGoals() ? (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Focus:
              </Typography>
              
              {mostRecentGoal && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      backgroundColor: 'rgba(74, 85, 162, 0.1)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      color: 'primary.main'
                    }}>
                      {getGoalTypeIcon(mostRecentGoal.type)}
                    </Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {getGoalTypeLabel(mostRecentGoal.type)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ pl: 5, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Focus Areas:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                      {renderGoalChips(mostRecentGoal)}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Target: {mostRecentGoal.weeklySessionTarget} sessions per week
                    </Typography>
                    
                    {mostRecentGoal.targetDate && (
                      <Typography variant="body2" color="text.secondary">
                        By: {new Date(mostRecentGoal.targetDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {userProfile?.goals.length} goal{userProfile?.goals.length !== 1 ? 's' : ''} set
              </Typography>
              <Button 
                component={Link} 
                to="/profile" 
                size="small" 
                color="primary"
                variant="text"
              >
                Manage Goals
              </Button>
            </Box>
          </>
        ) : (
          <Box>
            <Typography color="text.secondary" paragraph>
              You haven't set any speaking goals yet. Setting goals will help you track your
              progress and get personalized coaching.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              to="/profile"
              fullWidth
              sx={{ mt: 1 }}
            >
              Set Your Goals
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UserGoalsWidget;
