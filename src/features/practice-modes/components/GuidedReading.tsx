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
  IconButton
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { usePracticeMode } from '../hooks/usePracticeMode';
import { GuidedReadingContent } from '../services/practiceContentService';

const GuidedReading: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    guidedContent, 
    selectedContent, 
    selectedContentId, 
    selectContent, 
    startPracticeSession, 
    isLoading, 
    error 
  } = usePracticeMode({ initialType: 'guided' });
  
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredContent, setFilteredContent] = useState<GuidedReadingContent[]>([]);
  
  // Check if we're in selection or viewing mode
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Effect to filter content based on search and filters
  useEffect(() => {
    if (!guidedContent) return;
    
    let filtered = [...guidedContent];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        content => 
          content.title.toLowerCase().includes(term) || 
          content.text.toLowerCase().includes(term) ||
          content.keywords.some(keyword => keyword.toLowerCase().includes(term))
      );
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(
        content => content.level === difficultyFilter
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        content => content.category === categoryFilter
      );
    }
    
    setFilteredContent(filtered);
  }, [guidedContent, searchTerm, difficultyFilter, categoryFilter]);
  
  // Effect to check URL for content ID
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const contentId = queryParams.get('contentId');
    
    if (contentId) {
      selectContent(contentId);
      setViewMode('detail');
    }
  }, [location.search, selectContent]);
  
  // Handle content selection
  const handleSelectContent = (contentId: string) => {
    selectContent(contentId);
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
  
  // Get unique categories from content
  const getUniqueCategories = (): string[] => {
    if (!guidedContent) return [];
    
    const categories = new Set<string>();
    guidedContent.forEach(content => categories.add(content.category));
    return Array.from(categories);
  };
  
  // Render difficulty level chip
  const renderDifficultyChip = (level: string) => {
    let color: 'success' | 'primary' | 'error' = 'primary';
    
    switch (level) {
      case 'beginner':
        color = 'success';
        break;
      case 'intermediate':
        color = 'primary';
        break;
      case 'advanced':
        color = 'error';
        break;
    }
    
    return (
      <Chip 
        size="small" 
        color={color} 
        label={level.charAt(0).toUpperCase() + level.slice(1)} 
        icon={<SignalCellularAltIcon />}
      />
    );
  };
  
  // If in detail view mode, render the selected content
  if (viewMode === 'detail' && selectedContent) {
    const content = selectedContent as GuidedReadingContent;
    
    return (
      <Box sx={{ py: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
          sx={{ mb: 2 }}
        >
          Back to Passages
        </Button>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              {content.title}
            </Typography>
            {renderDifficultyChip(content.level)}
          </Box>
          
          <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              size="small" 
              variant="outlined" 
              label={`Category: ${content.category}`} 
            />
            <Chip 
              size="small" 
              variant="outlined" 
              icon={<AccessTimeIcon />} 
              label={`Est. time: ${Math.round(content.estimatedDuration / 10) * 10} seconds`} 
            />
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Reading Passage
          </Typography>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              background: '#f8f9fa', 
              mb: 3, 
              maxHeight: '350px', 
              overflow: 'auto',
              lineHeight: 1.8
            }}
          >
            <Typography variant="body1">
              {content.text}
            </Typography>
          </Paper>
          
          <Typography variant="subtitle2" gutterBottom>
            Reading Tips:
          </Typography>
          
          <ul>
            <Typography component="li" variant="body2">Read at a comfortable pace, focusing on clarity rather than speed.</Typography>
            <Typography component="li" variant="body2">Pay attention to punctuation, pausing at commas and periods.</Typography>
            <Typography component="li" variant="body2">Try to convey the meaning and emphasis naturally.</Typography>
            <Typography component="li" variant="body2">It's okay to make mistakes - this is practice!</Typography>
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
              ) : 'Start Reading Practice'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Otherwise, render the content selection list
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Select a Reading Passage
      </Typography>
      
      <Typography variant="body1" paragraph>
        Choose a passage that matches your interests and skill level. Each passage is designed to help you 
        practice specific aspects of clear speech.
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
              label="Search passages"
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
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
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
      ) : filteredContent.length > 0 ? (
        <Grid container spacing={3}>
          {filteredContent.map((content) => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
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
                onClick={() => handleSelectContent(content.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    {renderDifficultyChip(content.level)}
                    <Chip 
                      size="small" 
                      variant="outlined" 
                      icon={<AccessTimeIcon />} 
                      label={`${Math.round(content.estimatedDuration / 10) * 10}s`} 
                    />
                  </Box>
                  
                  <Typography variant="h6" component="h3" gutterBottom>
                    {content.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {content.text.substring(0, 120)}...
                  </Typography>
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Chip 
                      size="small" 
                      label={content.category} 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                    
                    {content.keywords.slice(0, 2).map(keyword => (
                      <Chip 
                        key={keyword} 
                        size="small" 
                        variant="outlined" 
                        label={keyword} 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" paragraph>
            No passages match your search criteria. Try adjusting your filters.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<SearchIcon />}
            onClick={() => {
              setSearchTerm('');
              setDifficultyFilter('all');
              setCategoryFilter('all');
            }}
          >
            Clear all filters
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default GuidedReading;
