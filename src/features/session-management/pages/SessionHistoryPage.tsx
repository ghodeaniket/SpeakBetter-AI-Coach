import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Fade
} from '@mui/material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useSessionManagement } from '../hooks/useSessionManagement';
import SessionList from '../components/SessionList';

/**
 * SessionHistoryPage component displays a list of the user's sessions
 * and provides functionality to manage them.
 */
const SessionHistoryPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const {
    sessions,
    isLoading,
    error,
    createNewSession,
    removeSession
  } = useSessionManagement({ userId: userProfile?.uid || null });
  
  const handleSessionSelect = (sessionId: string) => {
    if (sessionId) {
      navigate(`/speech-to-text?sessionId=${sessionId}`, { 
        replace: true
      });
    }
  };

  const handleSessionCreate = async (type: 'freestyle' | 'guided' | 'qa') => {
    try {
      const sessionId = await createNewSession(type);
      navigate(`/speech-to-text?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Fade in={true} timeout={500}>
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="500">
              Session History
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary">
              View and manage your practice sessions
            </Typography>
          </Box>
          
          <SessionList 
            sessions={sessions}
            isLoading={isLoading}
            error={error}
            onSelectSession={handleSessionSelect}
            onDeleteSession={removeSession}
            onCreateSession={handleSessionCreate}
          />
        </Box>
      </Fade>
    </Container>
  );
};

export default SessionHistoryPage;