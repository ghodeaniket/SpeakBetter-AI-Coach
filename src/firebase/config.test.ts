// Test file to verify Firebase configuration
import { getApp, getApps } from 'firebase/app';
import { auth, googleProvider } from './auth.config';
import { app } from './config';

// Log Firebase initialization status
console.log('Firebase apps initialized:', getApps().length);
console.log('Current Firebase app:', getApp().name);
console.log('Auth config:', auth ? 'Initialized' : 'Not initialized');
console.log('Google provider scopes:', googleProvider.getScopes());

// Test Firebase configuration
export const testFirebaseConfig = () => {
  try {
    console.log('Firebase app:', app ? 'Initialized' : 'Not initialized');
    console.log('Firebase auth:', auth ? 'Initialized' : 'Not initialized');
    console.log('Google provider:', googleProvider ? 'Initialized' : 'Not initialized');
    return true;
  } catch (error) {
    console.error('Firebase config test failed:', error);
    return false;
  }
};
