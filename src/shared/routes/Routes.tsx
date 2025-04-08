import React from 'react';
import { BrowserRouter, Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Dashboard from '../../features/dashboard';
import { SpeechToTextAnalyzer } from '../../features/speech-to-text/components';
import { TextToSpeechGenerator } from '../../features/text-to-speech/components';

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <RouterRoutes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/speech-to-text" element={<SpeechToTextAnalyzer />} />
          <Route path="/text-to-speech" element={<TextToSpeechGenerator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </RouterRoutes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default Routes;
