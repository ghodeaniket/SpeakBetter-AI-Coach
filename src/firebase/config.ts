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
  apiKey: "AIzaSyCulmoPl7m0DDyjEmYOXcLCjUOffLoMkVQ",
  authDomain: "speakbetter-dev-722cc.firebaseapp.com",
  projectId: "speakbetter-dev-722cc",
  storageBucket: "speakbetter-dev-722cc.firebasestorage.app",
  messagingSenderId: "1049134444873",
  appId: "1:1049134444873:web:99547aee8c1d0a4cbe2a98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
