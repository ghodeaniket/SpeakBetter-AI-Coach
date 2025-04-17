import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { App as MobileApp } from "@speakbetter/mobile";
import { Alert } from "react-native";

// Import centralized configuration
import config, { validateConfig } from "./config";

// Import firebase configurations
import {
  createFirebaseAuthService,
  createFirestoreService,
} from "@speakbetter/api";
import { useAuthStore } from "@speakbetter/state";

export default function App() {
  // Validate environment variables on app start
  useEffect(() => {
    const { isValid, missingVars } = validateConfig();
    if (!isValid) {
      Alert.alert(
        "Configuration Error",
        `Missing environment variables: ${missingVars.join(", ")}. The app may not function correctly.`,
        [{ text: "OK" }],
      );
    }
  }, []);

  // Initialize services
  const authService = createFirebaseAuthService(config.firebase);
  const firestoreService = createFirestoreService(config.firebase);

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
      <MobileApp
        authService={authService}
        firestoreService={firestoreService}
        googleCloudConfig={config.googleCloud}
        appConfig={config.app}
      />
    </SafeAreaProvider>
  );
}
