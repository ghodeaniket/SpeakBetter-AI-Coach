import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { App as MobileApp } from '@speakbetter/mobile';

// Import firebase configurations
import { createFirebaseAuthService, createFirestoreService } from '@speakbetter/api';
import { useAuthStore } from '@speakbetter/state';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Google Cloud configuration
const googleCloudConfig = {
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
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