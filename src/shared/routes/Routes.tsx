import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout/AppLayout';
import Dashboard from '../../features/dashboard';
import { SpeechToTextAnalyzer } from '../../features/speech-to-text/components';
import { TextToSpeechGenerator } from '../../features/text-to-speech/components';
import { SessionHistoryPage } from '../../features/session-management';
import { LoginPage } from '../../features/auth/pages';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/common';

const Routes: React.FC = () => {
  const { isLoading } = useAuth();

  // Don't render routes until auth state is determined
  if (isLoading) {
    return (
      <LoadingScreen
        isLoading={true}
        fullScreen={true}
        message="Getting ready..."
      />
    );
  }
  
  // Loading indicator for lazy loaded components
  const LoadingFallback = () => (
    <LoadingScreen 
      isLoading={true} 
      transparent={true}
      message="Loading..."
      size="small"
    />
  );

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
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/speech-to-text"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <SpeechToTextAnalyzer />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/text-to-speech"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <TextToSpeechGenerator />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/history"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <SessionHistoryPage />
                </Suspense>
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
