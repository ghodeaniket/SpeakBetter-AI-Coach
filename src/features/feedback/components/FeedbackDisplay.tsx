import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Paper,
  Divider,
  Tooltip,
  Collapse,
  Button,
  useTheme,
  Slide,
  Zoom,
  CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatIcon from '@mui/icons-material/Chat';

interface FeedbackSection {
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface FeedbackDisplayProps {
  feedback: {
    positive?: string;
    improvement?: string;
    suggestion?: string;
    encouragement?: string;
    text?: string; // Full text (alternative to sectioned feedback)
  };
  audioUrl?: string | null;
  isLoading?: boolean;
  isCompact?: boolean;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  audioUrl,
  isLoading = false,
  isCompact = false
}) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element if URL is provided
  React.useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => {
          setIsPlaying(false);
        });
      };
    }
  }, [audioUrl]);
  
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleReplay = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if we have sectioned feedback or just a single text
  const hasSectionedFeedback = feedback.positive || feedback.improvement || feedback.suggestion || feedback.encouragement;
  
  // Create feedback sections for structured display
  const feedbackSections: FeedbackSection[] = hasSectionedFeedback ? [
    {
      title: 'Strengths',
      content: feedback.positive || 'No strengths identified.',
      icon: <ThumbUpIcon fontSize="small" />
    },
    {
      title: 'Areas for Improvement',
      content: feedback.improvement || 'No improvement areas identified.',
      icon: <EmojiObjectsIcon fontSize="small" />
    },
    {
      title: 'Suggestions',
      content: feedback.suggestion || 'No specific suggestions available.',
      icon: <LightbulbIcon fontSize="small" />
    },
    {
      title: 'Encouragement',
      content: feedback.encouragement || 'Keep practicing!',
      icon: <ChatIcon fontSize="small" />
    }
  ] : [];
  
  // Determine if we should show compact view
  const showCompactView = isCompact || (window.innerWidth < 600);
  
  // Loading state
  if (isLoading) {
    return (
      <Card elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Generating AI coach feedback...
          </Typography>
        </Box>
      </Card>
    );
  }
  
  // No feedback state
  if (!hasSectionedFeedback && !feedback.text) {
    return (
      <Card elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No feedback available yet.
          </Typography>
        </Box>
      </Card>
    );
  }
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 3, 
        borderRadius: 2, 
        overflow: 'hidden',
        borderLeft: '4px solid',
        borderColor: 'primary.main'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          bgcolor: 'primaryLighter.main', 
          px: 2, 
          py: 1.5, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5
            }}
          >
            <SmartToyIcon fontSize="small" />
          </Box>
          <Typography variant="h6" color="primary.main">
            AI Coach Feedback
          </Typography>
        </Box>
        
        <Box>
          {audioUrl && (
            <>
              <Tooltip title={isPlaying ? "Pause" : "Play"}>
                <IconButton 
                  onClick={handlePlayPause}
                  color="primary"
                  sx={{ 
                    bgcolor: 'white',
                    '&:hover': {
                      bgcolor: 'primaryLighter.main'
                    }
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Replay">
                <IconButton 
                  onClick={handleReplay}
                  sx={{ 
                    ml: 1,
                    bgcolor: 'white',
                    '&:hover': {
                      bgcolor: 'primaryLighter.main'
                    }
                  }}
                >
                  <ReplayIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
            <IconButton 
              onClick={toggleExpand}
              sx={{ 
                ml: 1,
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: 'primary.lighter'
                }
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Feedback content */}
      <Collapse in={isExpanded} timeout="auto">
        <CardContent>
          {hasSectionedFeedback ? (
            <Box sx={{ mt: 1 }}>
              {feedbackSections.map((section, index) => (
                <Zoom 
                  in={true} 
                  style={{ transitionDelay: `${index * 100}ms` }}
                  key={section.title}
                >
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2,
                      bgcolor: index % 2 === 0 ? 'grey.50' : 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ 
                        color: 'primary.main',
                        display: 'flex',
                        mr: 1
                      }}>
                        {section.icon}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {section.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ ml: 0.5 }}>
                      {section.content}
                    </Typography>
                  </Paper>
                </Zoom>
              ))}
            </Box>
          ) : (
            <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
              {feedback.text}
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default FeedbackDisplay;
