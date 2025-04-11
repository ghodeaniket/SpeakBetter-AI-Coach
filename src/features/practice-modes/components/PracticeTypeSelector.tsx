import React from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  Divider,
  useTheme
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { usePracticeMode } from '../hooks/usePracticeMode';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`practice-tabpanel-${index}`}
      aria-labelledby={`practice-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
});

interface PracticeTypeSelectorProps {
  onSelectType?: (type: 'freestyle' | 'guided' | 'qa') => void;
}

const PracticeTypeSelector: React.FC<PracticeTypeSelectorProps> = ({ onSelectType }) => {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const { 
    practiceType, 
    setPracticeType, 
    startPracticeSession, 
    isLoading 
  } = usePracticeMode();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    
    // Map tab index to practice type
    const practiceTypes = ['freestyle', 'guided', 'qa'] as const;
    const selectedType = practiceTypes[newValue];
    
    // Update practice type in the hook
    setPracticeType(selectedType);
    
    // Notify parent component if callback provided
    if (onSelectType) {
      onSelectType(selectedType);
    }
  };

  // Practice type descriptions
  const practiceTypeDescriptions = {
    freestyle: {
      title: 'Freestyle Practice',
      description: 'Choose your own topic and speak freely for 1-3 minutes. Great for general practice and building confidence.',
      icon: <MicIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      benefits: [
        'Practice without constraints',
        'Choose your own topics',
        'Focus on natural speaking flow',
        'Improve impromptu speaking skills'
      ]
    },
    guided: {
      title: 'Guided Reading',
      description: 'Read provided text passages tailored to different skill levels. Perfect for improving pronunciation and pacing.',
      icon: <MenuBookIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      benefits: [
        'Structured practice with curated content',
        'Focus on pronunciation and clarity',
        'Practice formal language and complex phrases',
        'Compare your speech to the reference text'
      ]
    },
    qa: {
      title: 'Q&A Simulation',
      description: 'Answer prepared questions to practice interview scenarios and impromptu responses.',
      icon: <QuestionAnswerIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      benefits: [
        'Prepare for interviews and Q&A sessions',
        'Practice structured responses',
        'Improve thinking on your feet',
        'Reduce filler words in high-pressure situations'
      ]
    }
  };

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="practice type tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2
            }
          }}
        >
          <Tab 
            icon={<MicIcon />} 
            label="Freestyle" 
            id="practice-tab-0" 
            aria-controls="practice-tabpanel-0" 
          />
          <Tab 
            icon={<MenuBookIcon />} 
            label="Guided Reading" 
            id="practice-tab-1" 
            aria-controls="practice-tabpanel-1" 
          />
          <Tab 
            icon={<QuestionAnswerIcon />} 
            label="Q&A Simulation" 
            id="practice-tab-2" 
            aria-controls="practice-tabpanel-2" 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={value} index={0}>
        <PracticeTypeDetail 
          title={practiceTypeDescriptions.freestyle.title}
          description={practiceTypeDescriptions.freestyle.description}
          icon={practiceTypeDescriptions.freestyle.icon}
          benefits={practiceTypeDescriptions.freestyle.benefits}
          onStart={() => startPracticeSession()}
          isLoading={isLoading}
        />
      </TabPanel>
      
      <TabPanel value={value} index={1}>
        <PracticeTypeDetail 
          title={practiceTypeDescriptions.guided.title}
          description={practiceTypeDescriptions.guided.description}
          icon={practiceTypeDescriptions.guided.icon}
          benefits={practiceTypeDescriptions.guided.benefits}
          needsContentSelection
          nextStep="Select a reading passage on the next screen"
          onStart={() => startPracticeSession()}
          isLoading={isLoading}
        />
      </TabPanel>
      
      <TabPanel value={value} index={2}>
        <PracticeTypeDetail 
          title={practiceTypeDescriptions.qa.title}
          description={practiceTypeDescriptions.qa.description}
          icon={practiceTypeDescriptions.qa.icon}
          benefits={practiceTypeDescriptions.qa.benefits}
          needsContentSelection
          nextStep="Select a question on the next screen"
          onStart={() => startPracticeSession()}
          isLoading={isLoading}
        />
      </TabPanel>
    </Paper>
  );
};

interface PracticeTypeDetailProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  needsContentSelection?: boolean;
  nextStep?: string;
  onStart: () => void;
  isLoading: boolean;
}

const PracticeTypeDetail: React.FC<PracticeTypeDetailProps> = React.memo(({
  title,
  description,
  icon,
  benefits,
  needsContentSelection,
  nextStep,
  onStart,
  isLoading
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 2 }}>
              {icon}
            </Box>
            <Typography variant="h5" component="h3">
              {title}
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph>
            {description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Benefits:
          </Typography>
          
          <Box component="ul" sx={{ pl: 2, mt: 0 }}>
            {benefits.map((benefit, index) => (
              <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                {benefit}
              </Typography>
            ))}
          </Box>
          
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              fullWidth
              onClick={onStart}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : needsContentSelection ? 'Continue to Selection' : 'Start Practice'}
            </Button>
            
            {nextStep && (
              <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                {nextStep}
              </Typography>
            )}
          </Box>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardMedia
            component="img"
            image={`/images/practice-${title.toLowerCase().replace(/\s+/g, '-')}.jpg`}
            alt={title}
            sx={{ height: 200, objectFit: 'cover' }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // Fallback for missing images
              e.currentTarget.src = '/images/practice-default.jpg';
            }}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              How it works
            </Typography>
            
            {title === 'Freestyle Practice' && (
              <>
                <Typography variant="body2" paragraph>
                  In Freestyle Practice, you'll choose your own topic and speak for 1-3 minutes. 
                  This mode gives you complete freedom to practice whatever content is most relevant to you.
                </Typography>
                <Typography variant="body2">
                  After recording, our AI coach will analyze your speech and provide personalized feedback 
                  on your pace, filler words, clarity, and overall delivery.
                </Typography>
              </>
            )}
            
            {title === 'Guided Reading' && (
              <>
                <Typography variant="body2" paragraph>
                  In Guided Reading, you'll select from a variety of passages tailored to different skill levels and topics.
                  You'll read the passage aloud, focusing on clear pronunciation and natural pacing.
                </Typography>
                <Typography variant="body2">
                  Our AI coach will compare your reading to the text, providing detailed feedback on accuracy,
                  pronunciation, and delivery.
                </Typography>
              </>
            )}
            
            {title === 'Q&A Simulation' && (
              <>
                <Typography variant="body2" paragraph>
                  Q&A Simulation presents you with interview-style questions across various categories.
                  You'll respond naturally as you would in an interview or presentation Q&A session.
                </Typography>
                <Typography variant="body2">
                  Our AI coach will analyze your response structure, confidence, filler words, and pacing,
                  helping you improve your impromptu speaking skills.
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PracticeTypeSelector;
