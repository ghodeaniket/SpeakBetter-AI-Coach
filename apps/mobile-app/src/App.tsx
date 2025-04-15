import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { App as MobileApp } from "@speakbetter/mobile";
import Config from "react-native-config";

// Import firebase configurations
import {
  createFirebaseAuthService,
  createFirestoreService,
} from "@speakbetter/api";
import { useAuthStore } from "@speakbetter/state";

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
};

// Google Cloud configuration
const googleCloudConfig = {
  apiKey: Config.GOOGLE_CLOUD_API_KEY,
};

export default function App() {
  // Initialize services
  const authService = createFirebaseAuthService(firebaseConfig);
  const firestoreService = createFirestoreService(firebaseConfig);

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
        googleCloudConfig={googleCloudConfig}
      />
    </SafeAreaProvider>
  );
}
