import React from 'react';
import { BrowserRouter, Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout/AppLayout';
import Dashboard from '../../features/dashboard';
import { SpeechToTextAnalyzer } from '../../features/speech-to-text/components';
import { TextToSpeechGenerator } from '../../features/text-to-speech/components';
import { LoginPage } from '../../features/auth/pages';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const Routes: React.FC = () => {
  const { isLoading } = useAuth();

  // Don't render routes until auth state is determined
  if (isLoading) {
    return null;
  }

  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes - wrapped in AppLayout */}
        <Route element={<ProtectedRoute redirectPath="/login" />}>
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/speech-to-text"
            element={
              <AppLayout>
                <SpeechToTextAnalyzer />
              </AppLayout>
            }
          />
          <Route
            path="/text-to-speech"
            element={
              <AppLayout>
                <TextToSpeechGenerator />
              </AppLayout>
            }
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </RouterRoutes>
    </BrowserRouter>
  );
};

export default Routes;
