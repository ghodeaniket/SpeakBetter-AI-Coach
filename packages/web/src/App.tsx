import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createFirebaseAuthService, createFirestoreService, createGoogleSpeechService } from '@speakbetter/api';
import { useAuthStore } from '@speakbetter/state';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

// Import components
// These are placeholder imports - replace with actual components as they are implemented
import Dashboard from './features/dashboard/Dashboard';
import PracticeSession from './features/practice/PracticeSession';
import Feedback from './features/feedback/Feedback';
import Profile from './features/profile/Profile';
import Login from './features/auth/Login';
import PrivateRoute from './components/shared/PrivateRoute';

interface AppProps {
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  googleCloudConfig: {
    apiKey: string;
  };
}

const App: React.FC<AppProps> = ({ firebaseConfig, googleCloudConfig }) => {
  // Initialize services
  const authService = createFirebaseAuthService(firebaseConfig);
  const firestoreService = createFirestoreService(firebaseConfig);
  const speechService = createGoogleSpeechService(googleCloudConfig);
  
  // Connect auth state
  const { setUser, setLoading } = useAuthStore();
  
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [authService, setUser, setLoading]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login authService={authService} />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard firestoreService={firestoreService} />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/practice" 
            element={
              <PrivateRoute>
                <PracticeSession 
                  speechService={speechService} 
                  firestoreService={firestoreService} 
                />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/feedback/:sessionId" 
            element={
              <PrivateRoute>
                <Feedback firestoreService={firestoreService} />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile 
                  authService={authService}
                  firestoreService={firestoreService} 
                />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;