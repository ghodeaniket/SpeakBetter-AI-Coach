import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthService } from '@speakbetter/core';
import { useAuthStore } from '@speakbetter/state';

import { ThemeProvider } from './theme/ThemeProvider';
import { RootNavigator } from './navigation/RootNavigator';

interface AppProps {
  authService: AuthService;
  firestoreService: any; // Use proper type from core package
  googleCloudConfig: {
    apiKey: string;
  };
}

const App: React.FC<AppProps> = ({ 
  authService, 
  firestoreService, 
  googleCloudConfig 
}) => {
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
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <NavigationContainer>
          <RootNavigator 
            authService={authService}
            firestoreService={firestoreService}
            googleCloudConfig={googleCloudConfig}
          />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;