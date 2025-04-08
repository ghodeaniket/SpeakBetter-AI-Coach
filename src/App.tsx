import React from 'react';
import Routes from './shared/routes/Routes';
import { AuthProvider } from './shared/contexts/AuthContext';

/**
 * Main application component
 * Wraps the entire app with the AuthProvider
 * Uses the Routes component to handle navigation
 */
function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default App;
