import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Button,
  Tooltip,
  Skeleton
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MicIcon from '@mui/icons-material/Mic';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useNavigate } from 'react-router-dom';
import { Session } from '../../session-management/services/sessionService';
import { Timestamp } from 'firebase/firestore';

interface RecentSessionsWidgetProps {
  sessions: Session[];
  isLoading: boolean;
  onCreateSession: (type: 'freestyle' | 'guided' | 'qa') => Promise<void>;
}

const RecentSessionsWidget: React.FC<RecentSessionsWidgetProps> = ({
  sessions,
  isLoading,
  onCreateSession
}) => {
  const navigate = useNavigate();
  
  // Convert Firestore Timestamp to Date if needed and sort by createdAt
  const recentSessions = [...sessions]
    .sort((a, b) => {
      // Handle both Date objects and Firestore Timestamps
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);
  
  const handleSessionClick = (sessionId: string) => {
    navigate(`/speech-to-text?sessionId=${sessionId}`);
  };
  
  const handleNewSession = async () => {
    try {
      await onCreateSession('freestyle');
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  const handleViewAllClick = () => {
    navigate('/history');
  };
  
  // Helper to format date
  const formatDate = (dateInput: Date | any) => {
    // Convert Firestore Timestamp to Date if needed
    const date = dateInput instanceof Date ? dateInput : dateInput.toDate();
    
    // If today, show "Today at HH:MM"
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday at HH:MM"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise, show "MMM DD at HH:MM"
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Get session label based on type
  const getSessionTypeLabel = (type: string): string => {
    switch (type) {
      case 'freestyle':
        return 'Freestyle Practice';
      case 'guided':
        return 'Guided Reading';
      case 'qa':
        return 'Q&A Practice';
      default:
        return 'Practice Session';
    }
  };
  
  // Get status chip for session
  const getStatusChip = (session: Session) => {
    switch (session.status) {
      case 'completed':
        return (
          <Chip 
            size="small" 
            label="Completed" 
            color="success" 
            variant="outlined" 
          />
        );
      case 'processing':
        return (
          <Chip 
            size="small" 
            label="Processing" 
            color="warning" 
            variant="outlined" 
          />
        );
      case 'created':
      case 'recording':
        return (
          <Chip 
            size="small" 
            label="In Progress" 
            color="primary" 
            variant="outlined" 
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" display="flex" alignItems="center">
            <HistoryIcon sx={{ mr: 1 }} />
            Recent Sessions
          </Typography>
          
          <Button 
            size="small" 
            onClick={handleViewAllClick}
            endIcon={<KeyboardArrowRightIcon />}
          >
            View All
          </Button>
        </Box>
        
        {isLoading ? (
          // Loading skeleton
          <List sx={{ width: '100%' }}>
            {[1, 2, 3].map((item) => (
              <React.Fragment key={item}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Skeleton width="60%" />}
                    secondary={<Skeleton width="40%" />}
                  />
                </ListItem>
                {item < 3 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : recentSessions.length === 0 ? (
          // Empty state
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No practice sessions yet
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MicIcon />}
              onClick={handleNewSession}
              sx={{ mt: 2 }}
            >
              Start First Session
            </Button>
          </Box>
        ) : (
          // Session list
          <List sx={{ width: '100%' }}>
            {recentSessions.map((session, index) => (
              <React.Fragment key={session.id}>
                <ListItem
                  alignItems="flex-start"
                  button
                  onClick={() => handleSessionClick(session.id)}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(74, 85, 162, 0.08)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      <MicIcon />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" color="text.primary">
                          {getSessionTypeLabel(session.type)}
                        </Typography>
                        {getStatusChip(session)}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(session.createdAt)}
                        {session.durationSeconds > 0 && ` • ${Math.round(session.durationSeconds / 60)} min`}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Continue session">
                      <IconButton edge="end" onClick={(e) => {
                        e.stopPropagation();
                        handleSessionClick(session.id);
                      }}>
                        <PlayArrowIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < recentSessions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
            {/* Button to view all sessions */}
            <ListItem sx={{ justifyContent: 'space-between', mt: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleNewSession}
                startIcon={<MicIcon />}
              >
                Quick Session
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => navigate('/practice')}
              >
                Practice Modes
              </Button>
            </ListItem>
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSessionsWidget;
