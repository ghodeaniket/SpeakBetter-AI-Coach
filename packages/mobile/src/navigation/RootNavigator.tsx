import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthStack } from './AuthStack';
import { useAuthStore } from '@speakbetter/state';
import { useStyles } from '../theme/useStyles';
import { AuthService } from '@speakbetter/core';

// Define the root navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  authService: AuthService;
  firestoreService: any; // Use proper type
  googleCloudConfig: {
    apiKey: string;
  };
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({
  authService,
  firestoreService,
  googleCloudConfig
}) => {
  const { user, isLoading } = useAuthStore();
  
  const styles = useStyles(theme => ({
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  }));
  
  // Show a loading indicator while checking authentication state
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4A55A2" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator} 
          initialParams={{
            firestoreService,
            googleCloudConfig
          }}
        />
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthStack} 
          initialParams={{
            authService
          }}
        />
      )}
    </Stack.Navigator>
  );
};