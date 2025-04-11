import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  IconButton,
  Grid,
  Paper,
  Card,
  CardContent,
  Slide
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VoiceChatIcon from '@mui/icons-material/VoiceChat';
import BarChartIcon from '@mui/icons-material/BarChart';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useHelp } from '../../../App';

// Dialog transition
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const HelpGuide: React.FC = () => {
  const { showHelp, setShowHelp, helpTopic } = useHelp();
  const [activeTab, setActiveTab] = useState(0);
  
  // Set active tab based on help topic
  useEffect(() => {
    switch (helpTopic) {
      case 'recording':
        setActiveTab(0);
        break;
      case 'analysis':
        setActiveTab(1);
        break;
      case 'feedback':
        setActiveTab(2);
        break;
      case 'progress':
        setActiveTab(3);
        break;
      case 'tips':
        setActiveTab(4);
        break;
      default:
        setActiveTab(0);
    }
  }, [helpTopic]);

  const handleClose = () => {
    setShowHelp(false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={showHelp}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-describedby="help-dialog-description"
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HelpOutlineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">SpeakBetter Help & Guide</Typography>
        </Box>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 0 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Recording" icon={<MicIcon />} iconPosition="start" />
          <Tab label="Analysis" icon={<RecordVoiceOverIcon />} iconPosition="start" />
          <Tab label="Feedback" icon={<VoiceChatIcon />} iconPosition="start" />
          <Tab label="Progress" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Speaking Tips" icon={<TipsAndUpdatesIcon />} iconPosition="start" />
        </Tabs>
        
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>How to Record Your Speech</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Choose a Quiet Environment"
                    secondary="Find a location with minimal background noise for best results"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Use a Good Microphone"
                    secondary="A headset or external microphone generally produces better results than built-in laptop mics"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Stay Consistent Distance from Mic"
                    secondary="Try to maintain a consistent distance from your microphone"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Speak Clearly and Naturally"
                    secondary="Don't exaggerate your speech - speak as you would normally"
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="medium">
                    Recording Process
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="1. Click the record button"
                        secondary="Allow microphone permissions if prompted"
                      />
                    </ListItem>
                    <Divider component="li" variant="inset" />
                    <ListItem>
                      <ListItemText
                        primary="2. Speak for 30 seconds to 3 minutes"
                        secondary="The ideal sample length is 1-2 minutes"
                      />
                    </ListItem>
                    <Divider component="li" variant="inset" />
                    <ListItem>
                      <ListItemText
                        primary="3. Click Stop when finished"
                        secondary="Your recording will be processed automatically"
                      />
                    </ListItem>
                    <Divider component="li" variant="inset" />
                    <ListItem>
                      <ListItemText
                        primary="4. Review or re-record"
                        secondary="You can listen to your recording before submitting"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Tip: For the most accurate analysis, try to speak continuously for at least 30 seconds.
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>Understanding Your Speech Analysis</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Key Metrics Explained</Typography>
              <List>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: 'primaryLighter.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main'
                    }}>
                      1
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary="Speaking Pace (WPM)"
                    secondary="Words per minute measures how quickly you speak. Ideal range is 120-160 WPM for most contexts."
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: 'primaryLighter.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main'
                    }}>
                      2
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary="Filler Words"
                    secondary="Words like 'um', 'uh', 'like', etc. that don't add meaning. Aim to keep these below 5% of your total words."
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: 'primaryLighter.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main'
                    }}>
                      3
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary="Clarity Score"
                    secondary="Measures how clearly you articulate words. Higher scores indicate better articulation."
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  How to Use Your Analysis
                </Typography>
                
                <Typography variant="body2" paragraph>
                  Your speech analysis highlights patterns in your speaking style. Here's how to interpret it:
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Focus on one area at a time"
                      secondary="Don't try to fix everything at once"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Track trends over multiple sessions"
                      secondary="Look for patterns rather than one-time results"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Review the highlighted transcript"
                      secondary="Identify specific moments to improve"
                    />
                  </ListItem>
                </List>
              </Paper>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Tip: For the most improvement, practice consistently and focus on your biggest area of opportunity.
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>Getting the Most from AI Feedback</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Understanding AI Feedback</Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" paragraph>
                  The AI coach provides personalized feedback based on your speech analysis. Each feedback segment has a specific purpose:
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Positive Observations"
                      secondary="Highlights what you're doing well to reinforce good habits"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Areas for Improvement"
                      secondary="Identifies specific patterns that could be enhanced"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Actionable Suggestions"
                      secondary="Provides specific techniques you can practice"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Encouragement"
                      secondary="Motivational guidance to keep you improving"
                    />
                  </ListItem>
                </List>
              </Paper>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Feedback is aligned with your goals
              </Typography>
              <Typography variant="body2">
                The suggestions you receive will prioritize the speaking goals you've set in your profile.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="medium">
                    Tips for Using Feedback Effectively
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Listen to audio feedback multiple times"
                        secondary="You may notice different insights on repeated listens"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Try implementing one suggestion at a time"
                        secondary="Focus on mastering one technique before moving to the next"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Practice the suggested techniques daily"
                        secondary="Even 5 minutes of focused practice can make a difference"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Record a new session after implementing feedback"
                        secondary="See if your metrics improve in the targeted areas"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>Tracking Your Progress</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Understanding Progress Metrics</Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <BarChartIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Historical Trends"
                    secondary="Charts show your speaking metrics over time, helping you identify patterns and improvements"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <BarChartIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Achievements"
                    secondary="Milestones awarded for consistent practice and improvement in specific areas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <BarChartIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Practice Consistency"
                    secondary="Tracks your regular practice patterns to encourage steady improvement"
                  />
                </ListItem>
              </List>
              
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Progress Expectations
                </Typography>
                <Typography variant="body2" paragraph>
                  Speech improvement is a gradual process. Most users see measurable improvements after 5-10 practice sessions.
                </Typography>
                <Typography variant="body2">
                  Focus on consistent, small improvements rather than dramatic changes. Speaking skills develop through regular practice over time.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="medium">
                    Maximizing Your Improvement
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Practice consistently"
                        secondary="Aim for 2-3 sessions per week for optimal improvement"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Apply feedback in real situations"
                        secondary="Practice your techniques during actual conversations or presentations"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Review historical sessions"
                        secondary="Compare your earliest recordings with recent ones to hear your improvement"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon sx={{ color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Celebrate achievements"
                        secondary="Acknowledge your progress, no matter how small"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Tip: The best speakers in the world still practice regularly. Continuous improvement is always possible.
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>Professional Speaking Tips</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Eliminating Filler Words</Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Practice mindful pausing"
                      secondary="Replace 'um' and 'uh' with a brief silence"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Record yourself in everyday conversations"
                      secondary="Awareness is the first step to reducing filler words"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Slow down slightly"
                      secondary="Speaking too quickly often increases filler word usage"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Prepare and practice key points"
                      secondary="Knowing your content reduces verbal hesitations"
                    />
                  </ListItem>
                </List>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>Improving Vocal Variety</Typography>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Vary your pitch for emphasis"
                      secondary="Raising or lowering your voice helps highlight important points"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Modify your speaking pace"
                      secondary="Slow down for important points, speed up for less critical details"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Use strategic pauses"
                      secondary="Silence before or after key points adds powerful emphasis"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Practice reading aloud expressively"
                      secondary="Try reading children's books or poetry to develop expression"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Building Confidence</Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Prepare thoroughly"
                      secondary="Knowing your content well is the foundation of confidence"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Practice power poses"
                      secondary="Standing in confident postures for 2 minutes can reduce stress hormones"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Visualize successful speaking"
                      secondary="Mental rehearsal activates the same neural pathways as actual practice"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Focus on your message, not yourself"
                      secondary="Thinking about helping your audience reduces self-consciousness"
                    />
                  </ListItem>
                </List>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>Effective Delivery Techniques</Typography>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Make eye contact"
                      secondary="Look at individuals for 3-5 seconds before moving to another person"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Use natural gestures"
                      secondary="Let your hands emphasize points naturally - avoid keeping them rigid"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Speak to the back row"
                      secondary="Project your voice without shouting to ensure everyone can hear"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Structure with clear transitions"
                      secondary="Signal movement between topics with phrases like 'Next, let's explore...'"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpGuide;