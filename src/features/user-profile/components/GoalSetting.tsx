import React, { useState } from 'react';
import { 
  Typography, Box, Paper, FormControl, InputLabel, Select, MenuItem, Chip, 
  TextField, Button, Grid, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
  FormHelperText, CircularProgress, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useUserProfile } from '../../../shared/hooks/useUserProfile';
import { UserGoal } from '../../../types/userProfile';

const GoalSetting: React.FC = () => {
  const { userProfile, addGoal, removeGoal } = useUserProfile();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New goal form state
  const [newGoal, setNewGoal] = useState<{
    type: string;
    focus: string[];
    weeklySessionTarget: number;
    targetDate?: Date;
  }>({
    type: 'presentation',
    focus: [],
    weeklySessionTarget: 3,
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<{
    focus?: string;
    weeklySessionTarget?: string;
  }>({});

  // Options for the form
  const goalTypes = [
    { value: 'presentation', label: 'Presentation Skills' },
    { value: 'interview', label: 'Interview Preparation' },
    { value: 'everyday', label: 'Everyday Communication' }
  ];
  
  const focusAreas = [
    { value: 'pace', label: 'Speaking Pace' },
    { value: 'fillers', label: 'Filler Words' },
    { value: 'clarity', label: 'Articulation Clarity' },
    { value: 'confidence', label: 'Confidence' },
    { value: 'structure', label: 'Speech Structure' }
  ];
  
  const validateForm = (): boolean => {
    const newErrors: {
      focus?: string;
      weeklySessionTarget?: string;
    } = {};
    
    if (newGoal.focus.length === 0) {
      newErrors.focus = 'Please select at least one focus area';
    }
    
    if (newGoal.weeklySessionTarget < 1) {
      newErrors.weeklySessionTarget = 'Weekly target must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddGoal = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await addGoal(newGoal as UserGoal);
      // Reset form
      setNewGoal({
        type: 'presentation',
        focus: [],
        weeklySessionTarget: 3,
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteGoal = async (goalId: string | undefined) => {
    if (!goalId) return;
    
    try {
      await removeGoal(goalId);
    } catch (error) {
      console.error('Error removing goal:', error);
    }
  };
  
  const handleFocusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setNewGoal(prev => ({
      ...prev,
      focus: event.target.value as string[]
    }));
  };
  
  const getGoalTypeLabel = (type: string): string => {
    const goalType = goalTypes.find(gt => gt.value === type);
    return goalType ? goalType.label : type;
  };
  
  const getFocusAreaLabels = (focusAreas: string[]): string => {
    return focusAreas.map(focus => {
      const area = focusAreas.find(fa => fa.value === focus);
      return area ? area.label : focus;
    }).join(', ');
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Your Speaking Goals
      </Typography>
      
      {userProfile?.goals && userProfile.goals.length > 0 ? (
        <List>
          {userProfile.goals.map((goal, index) => (
            <React.Fragment key={goal.id || index}>
              {index > 0 && <Divider component="li" />}
              <ListItem>
                <ListItemText
                  primary={getGoalTypeLabel(goal.type)}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textPrimary">
                        Focus: {goal.focus.join(', ')}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Target: {goal.weeklySessionTarget} sessions per week
                      </Typography>
                      {goal.targetDate && (
                        <>
                          <br />
                          <Typography component="span" variant="body2">
                            Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                          </Typography>
                        </>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="textSecondary" sx={{ my: 2 }}>
          You haven't set any speaking goals yet. Add a goal to get personalized coaching.
        </Typography>
      )}
      
      {!isAdding ? (
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          color="primary"
          onClick={() => setIsAdding(true)}
          sx={{ mt: 2 }}
        >
          Add New Goal
        </Button>
      ) : (
        <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New Goal
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="goal-type-label">Goal Type</InputLabel>
                <Select
                  labelId="goal-type-label"
                  value={newGoal.type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value }))}
                  label="Goal Type"
                >
                  {goalTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!errors.weeklySessionTarget}>
                <TextField
                  label="Weekly Sessions Target"
                  type="number"
                  value={newGoal.weeklySessionTarget}
                  onChange={(e) => setNewGoal(prev => ({ 
                    ...prev, 
                    weeklySessionTarget: parseInt(e.target.value) || 0 
                  }))}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                  error={!!errors.weeklySessionTarget}
                  helperText={errors.weeklySessionTarget}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" error={!!errors.focus}>
                <InputLabel id="focus-areas-label">Focus Areas</InputLabel>
                <Select
                  labelId="focus-areas-label"
                  multiple
                  value={newGoal.focus}
                  onChange={handleFocusChange}
                  label="Focus Areas"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const focusItem = focusAreas.find(fa => fa.value === value);
                        return (
                          <Chip key={value} label={focusItem ? focusItem.label : value} />
                        );
                      })}
                    </Box>
                  )}
                >
                  {focusAreas.map(area => (
                    <MenuItem key={area.value} value={area.value}>
                      {area.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.focus && <FormHelperText>{errors.focus}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Target Date (Optional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newGoal.targetDate ? new Date(newGoal.targetDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setNewGoal(prev => ({ 
                  ...prev, 
                  targetDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="text" 
              onClick={() => setIsAdding(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddGoal}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Add Goal'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default GoalSetting;
