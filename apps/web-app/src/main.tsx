import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@speakbetter/web';
import './index.css';

// Initialize Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Google Cloud configuration
const googleCloudConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY,
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App 
      firebaseConfig={firebaseConfig}
      googleCloudConfig={googleCloudConfig}
    />
  </React.StrictMode>
);
