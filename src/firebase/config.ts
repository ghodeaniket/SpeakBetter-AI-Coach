// Firebase configuration
// Note: In a production environment, these values should be in environment variables
// For Sprint 0 validation purposes, we'll initialize it here directly

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// For debugging
console.log('Firebase config being used:', {
  apiKey: firebaseConfig.apiKey ? "[SET]" : "[MISSING]",
  authDomain: firebaseConfig.authDomain ? "[SET]" : "[MISSING]",
  projectId: firebaseConfig.projectId ? "[SET]" : "[MISSING]",
  storageBucket: firebaseConfig.storageBucket ? "[SET]" : "[MISSING]",
  messagingSenderId: firebaseConfig.messagingSenderId ? "[SET]" : "[MISSING]", 
  appId: firebaseConfig.appId ? "[SET]" : "[MISSING]"
});

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;
let functions;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Configure Firestore for better connection handling
  db.settings({
    cacheSizeBytes: 1048576 * 100, // 100 MB cache size
    ignoreUndefinedProperties: true
  });
  
  storage = getStorage(app);
  functions = getFunctions(app);
  
  console.log('Firebase services initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export initialized services
export { app, auth, db, storage, functions };

// Helper function to check if Firestore is connected
export const checkFirestoreConnection = async () => {
  try {
    // Try a small read operation to test connectivity
    const timestamp = new Date();
    console.log(`Testing Firestore connection at ${timestamp.toISOString()}`);
    
    // Set a 10-second timeout for the operation
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore connection timeout')), 10000)
    );
    
    // Import needed functions from firestore
    const { collection, query, limit, getDocs } = await import('firebase/firestore');
    
    // Attempt connection using v9 modular API
    await Promise.race([
      timeout,
      getDocs(query(collection(db, '_connection_test'), limit(1)))
    ]);
    
    console.log('Firestore connection successful');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};
