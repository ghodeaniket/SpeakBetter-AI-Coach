import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FeedbackIcon from '@mui/icons-material/Feedback';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import QuizIcon from '@mui/icons-material/Quiz';
import { Session } from '../services/sessionService';

interface SessionCardProps {
  session: Session;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown date';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
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
  
  // Otherwise, show "MMM DD, YYYY at HH:MM"
  return `${date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })} at ${date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
};

const getSessionTypeName = (type: string): string => {
  switch (type) {
    case 'freestyle':
      return 'Freestyle Practice';
    case 'guided':
      return 'Guided Reading';
    case 'qa':
      return 'Q&A Simulation';
    default:
      return 'Practice Session';
  }
};

const getSessionIcon = (type: string) => {
  switch (type) {
    case 'freestyle':
      return <MicIcon fontSize="small" />;
    case 'guided':
      return <RecordVoiceOverIcon fontSize="small" />;
    case 'qa':
      return <QuizIcon fontSize="small" />;
    default:
      return <MicIcon fontSize="small" />;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'processing':
      return 'Processing';
    case 'recording':
      return 'Recording';
    case 'created':
      return 'In Progress';
    case 'error':
      return 'Error';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
    case 'recording':
    case 'created':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

const SessionCard: React.FC<SessionCardProps> = ({ session, onSelect, onDelete }) => {
  const theme = useTheme();
  const statusColor = getStatusColor(session.status);
  const isProcessing = session.status === 'processing';
  
  // Format duration as MM:SS
  const formattedDuration = session.durationSeconds 
    ? `${Math.floor(session.durationSeconds / 60)}:${(session.durationSeconds % 60).toString().padStart(2, '0')}` 
    : '0:00';
  
  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Status indicator top bar */}
      <Box 
        sx={{ 
          height: 4, 
          width: '100%', 
          backgroundColor: `${statusColor}.main`,
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      
      {/* Processing indicator */}
      {isProcessing && (
        <LinearProgress sx={{ position: 'absolute', top: 4, left: 0, right: 0 }} />
      )}
      
      <CardContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          {/* Session type icon */}
          <Box 
            sx={{ 
              backgroundColor: `${theme.palette.primary.main}15`, 
              color: 'primary.main',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            {getSessionIcon(session.type)}
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h6" component="div" sx={{ lineHeight: 1.3 }}>
                {session.title || getSessionTypeName(session.type)}
              </Typography>
              
              <Chip 
                label={getStatusLabel(session.status)} 
                size="small" 
                color={statusColor} 
                variant="outlined" 
                sx={{ ml: 1, mt: 0.5 }}
              />
            </Box>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'text.secondary',
                mt: 0.5,
                flexWrap: 'wrap'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 0.5 }}>
                <DateRangeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Typography variant="body2">
                  {formatDate(session.createdAt)}
                </Typography>
              </Box>
              
              {session.durationSeconds > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                  <Typography variant="body2">
                    {formattedDuration}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
      
      <Divider sx={{ mx: 2 }} />
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        px: 2,
        py: 1
      }}>
        <Box>
          {session.hasAnalysis && (
            <Tooltip title="Analysis available">
              <Chip 
                icon={<AnalyticsIcon fontSize="small" />}
                label="Analysis" 
                size="small" 
                color="primary" 
                variant="outlined" 
                sx={{ mr: 1 }} 
              />
            </Tooltip>
          )}
          
          {session.hasFeedback && (
            <Tooltip title="Feedback available">
              <Chip 
                icon={<FeedbackIcon fontSize="small" />}
                label="Feedback" 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            </Tooltip>
          )}
        </Box>
        
        <Box>
          <Tooltip title="Delete session">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDelete(session.id!)}
              sx={{ mr: 1 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isProcessing ? 'Processing...' : 'View session'}>
            <span> {/* Wrapper to allow tooltip on disabled button */}
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => onSelect(session.id!)}
                disabled={isProcessing}
                sx={{ 
                  backgroundColor: isProcessing ? 'transparent' : 'primaryLighter.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white'
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
};

export default SessionCard;
