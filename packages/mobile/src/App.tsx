import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './theme/ThemeProvider';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { AuthProvider, ProfileProvider, SettingsProvider } from './contexts';

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <SettingsProvider>
            <ThemeProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ThemeProvider>
          </SettingsProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;