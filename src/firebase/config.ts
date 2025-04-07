// Firebase configuration
// Note: In a production environment, these values should be in environment variables
// For Sprint 0 validation purposes, we'll initialize it here directly

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
// Replace these with your actual Firebase project configuration after creating it
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "speakbetter-ai-coach.firebaseapp.com",
  projectId: "speakbetter-ai-coach",
  storageBucket: "speakbetter-ai-coach.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
