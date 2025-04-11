import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FlagIcon from '@mui/icons-material/Flag';
import CategoryIcon from '@mui/icons-material/Category';
import { usePracticeMode } from '../hooks/usePracticeMode';
import { QAQuestion } from '../services/practiceContentService';

const QASimulation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    qaQuestions, 
    selectedContent, 
    selectedContentId, 
    selectContent, 
    startPracticeSession, 
    isLoading, 
    error 
  } = usePracticeMode({ initialType: 'qa' });
  
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredQuestions, setFilteredQuestions] = useState<QAQuestion[]>([]);
  
  // Check if we're in selection or viewing mode
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Effect to filter questions based on search and filters
  useEffect(() => {
    if (!qaQuestions) return;
    
    let filtered = [...qaQuestions];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        question => 
          question.question.toLowerCase().includes(term) || 
          (question.context && question.context.toLowerCase().includes(term)) ||
          (question.suggestedTopics && 
            question.suggestedTopics.some(topic => topic.toLowerCase().includes(term)))
      );
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(
        question => question.difficulty === difficultyFilter
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        question => question.category === categoryFilter
      );
    }
    
    setFilteredQuestions(filtered);
  }, [qaQuestions, searchTerm, difficultyFilter, categoryFilter]);
  
  // Effect to check URL for content ID
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const contentId = queryParams.get('contentId');
    
    if (contentId) {
      selectContent(contentId);
      setViewMode('detail');
    }
  }, [location.search, selectContent]);
  
  // Handle question selection
  const handleSelectQuestion = (questionId: string) => {
    selectContent(questionId);
    setViewMode('detail');
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setViewMode('list');
  };
  
  // Handle start practice
  const handleStartPractice = () => {
    startPracticeSession();
  };
  
  // Get unique categories from questions
  const getUniqueCategories = (): string[] => {
    if (!qaQuestions) return [];
    
    const categories = new Set<string>();
    qaQuestions.forEach(question => categories.add(question.category));
    return Array.from(categories);
  };
  
  // Render difficulty level chip
  const renderDifficultyChip = (difficulty: string) => {
    let color: 'success' | 'primary' | 'error' = 'primary';
    
    switch (difficulty) {
      case 'easy':
        color = 'success';
        break;
      case 'medium':
        color = 'primary';
        break;
      case 'hard':
        color = 'error';
        break;
    }
    
    return (
      <Chip 
        size="small" 
        color={color} 
        label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} 
        icon={<FlagIcon />}
      />
    );
  };
  
  // If in detail view mode, render the selected question
  if (viewMode === 'detail' && selectedContent) {
    const question = selectedContent as QAQuestion;
    
    return (
      <Box sx={{ py: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
          sx={{ mb: 2 }}
        >
          Back to Questions
        </Button>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Question
            </Typography>
            {renderDifficultyChip(question.difficulty)}
          </Box>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              background: '#f8f9fa', 
              mb: 3,
              borderLeft: '4px solid',
              borderLeftColor: 'primary.main'
            }}
          >
            <Typography variant="h6">
              {question.question}
            </Typography>
          </Paper>
          
          {question.context && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Context:
              </Typography>
              <Typography variant="body2">
                {question.context}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              size="small" 
              variant="outlined" 
              icon={<CategoryIcon />}
              label={`Category: ${question.category}`} 
            />
          </Box>
          
          {question.suggestedTopics && question.suggestedTopics.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested topics to address:
              </Typography>
              <List dense>
                {question.suggestedTopics.map((topic, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={topic} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Answering Tips:
          </Typography>
          
          <ul>
            <Typography component="li" variant="body2">Structure your answer with a clear beginning, middle, and end.</Typography>
            <Typography component="li" variant="body2">Use the STAR method (Situation, Task, Action, Result) for experience-based questions.</Typography>
            <Typography component="li" variant="body2">Take a moment to organize your thoughts before speaking.</Typography>
            <Typography component="li" variant="body2">Aim for a 1-2 minute response that is concise but thorough.</Typography>
          </ul>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleStartPractice}
              disabled={isLoading}
              sx={{ px: 4 }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Loading...
                </>
              ) : 'Start Q&A Practice'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Otherwise, render the question selection list
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Select a Question
      </Typography>
      
      <Typography variant="body1" paragraph>
        Choose a question to practice your impromptu speaking skills. These questions are designed to simulate
        interview scenarios, presentation Q&As, and everyday professional conversations.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Search and filter controls */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Search questions"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="difficulty-filter-label">Difficulty Level</InputLabel>
              <Select
                labelId="difficulty-filter-label"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                label="Difficulty Level"
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {getUniqueCategories().map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredQuestions.length > 0 ? (
        <Grid container spacing={3}>
          {filteredQuestions.map((question) => (
            <Grid item xs={12} md={6} key={question.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleSelectQuestion(question.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      size="small" 
                      variant="outlined" 
                      icon={<CategoryIcon />}
                      label={question.category} 
                    />
                    {renderDifficultyChip(question.difficulty)}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <HelpOutlineIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                    <Typography variant="h6" component="h3">
                      {question.question}
                    </Typography>
                  </Box>
                  
                  {question.context && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Context:</strong> {question.context}
                    </Typography>
                  )}
                  
                  {question.suggestedTopics && question.suggestedTopics.length > 0 && (
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        Suggested topics:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {question.suggestedTopics.slice(0, 3).map((topic, index) => (
                          <Chip 
                            key={index} 
                            size="small" 
                            variant="outlined" 
                            label={topic} 
                          />
                        ))}
                        {question.suggestedTopics.length > 3 && (
                          <Chip 
                            size="small" 
                            variant="outlined" 
                            label={`+${question.suggestedTopics.length - 3} more`} 
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            No questions match your search criteria. Try adjusting your filters.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default QASimulation;
