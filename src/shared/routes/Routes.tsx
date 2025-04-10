import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout/AppLayout';
import Dashboard from '../../features/dashboard';
import { SpeechToTextAnalyzer } from '../../features/speech-to-text/components';
import { TextToSpeechGenerator } from '../../features/text-to-speech/components';
import { FeedbackPage } from '../../features/feedback';
import { SessionHistoryPage } from '../../features/session-management';
import { ProfileManager } from '../../features/user-profile';
import { PracticePage } from '../../features/practice-modes';
import { LoginPage } from '../../features/auth/pages';
import { ProgressDashboard } from '../../features/progress-tracking';
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
            path="/speech-analysis"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <SpeechToTextAnalyzer />
                </Suspense>
              </AppLayout>
            }
          />
          {/* Practice mode routes */}
          <Route
            path="/practice"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <PracticePage />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/practice/:type"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <PracticePage />
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
            path="/feedback"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <FeedbackPage />
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
          <Route
            path="/profile"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProfileManager />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/progress"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProgressDashboard />
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
