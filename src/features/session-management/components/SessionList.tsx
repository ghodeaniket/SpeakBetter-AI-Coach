import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Session } from '../services/sessionService';
import SessionCard from './SessionCard';

interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onCreateSession: (type: 'freestyle' | 'guided' | 'qa') => Promise<void>;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  isLoading,
  error,
  onSelectSession,
  onDeleteSession,
  onCreateSession
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionTypeTab, setSessionTypeTab] = useState<'all' | 'freestyle' | 'guided' | 'qa'>('all');
  const [createSessionOpen, setCreateSessionOpen] = useState(false);

  // Handle session delete confirmation
  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  // Confirm and execute session deletion
  const confirmDelete = async () => {
    if (sessionToDelete) {
      setIsDeleting(true);
      try {
        await onDeleteSession(sessionToDelete);
      } catch (error) {
        console.error('Error deleting session:', error);
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
      }
    }
  };

  // Cancel session deletion
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  // Handle tab change for filtering sessions
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'all' | 'freestyle' | 'guided' | 'qa') => {
    setSessionTypeTab(newValue);
  };

  // Filter sessions based on selected tab
  const filteredSessions = sessionTypeTab === 'all'
    ? sessions
    : sessions.filter(session => session.type === sessionTypeTab);

  // Create a new session
  const handleCreateSession = async (type: 'freestyle' | 'guided' | 'qa') => {
    setCreateSessionOpen(false);
    await onCreateSession(type);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Practice Sessions
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateSessionOpen(true)}
        >
          New Session
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={sessionTypeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All" value="all" />
          <Tab label="Freestyle" value="freestyle" />
          <Tab label="Guided" value="guided" />
          <Tab label="Q&A" value="qa" />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredSessions.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No {sessionTypeTab !== 'all' ? sessionTypeTab : ''} sessions found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a new session to start practicing your speaking skills
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateSessionOpen(true)}
          >
            Start New Session
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={onSelectSession}
              onDelete={handleDeleteClick}
            />
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this session? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={isDeleting}
            startIcon={isDeleting && <CircularProgress size={20} />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog
        open={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        aria-labelledby="create-session-dialog-title"
      >
        <DialogTitle id="create-session-dialog-title">New Practice Session</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Choose the type of practice session you want to create:
          </DialogContentText>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleCreateSession('freestyle')}
              sx={{ justifyContent: 'flex-start', py: 2 }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1">Freestyle Practice</Typography>
                <Typography variant="body2" color="text.secondary">
                  Speak about any topic of your choice
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => handleCreateSession('guided')}
              sx={{ justifyContent: 'flex-start', py: 2 }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1">Guided Reading</Typography>
                <Typography variant="body2" color="text.secondary">
                  Read provided text aloud for practice
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => handleCreateSession('qa')}
              sx={{ justifyContent: 'flex-start', py: 2 }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1">Q&A Simulation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Practice answering interview-style questions
                </Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSessionOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionList;
