import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const TestHistoryPage = () => {
  console.log('TestHistoryPage rendering');
  
  return (
    <Container>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">
          Session History Test Page
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This is a simple test page to verify routing.
        </Typography>
      </Box>
    </Container>
  );
};

export default TestHistoryPage;