import { getAuth, connectAuthEmulator, GoogleAuthProvider, browserPopupRedirectResolver } from 'firebase/auth';
import { app } from './config';

// Get the auth instance
const auth = getAuth(app);

// Log auth configuration for debugging
console.log('Auth domain being used:', auth.config.authDomain);
console.log('Environment:', import.meta.env.DEV ? 'Development' : 'Production');

// Enable emulator if in development mode
if (import.meta.env.DEV && import.meta.env.VITE_USE_AUTH_EMULATOR === 'true') {
  console.log('Using Auth Emulator');
  connectAuthEmulator(auth, 'http://localhost:9099');
}

// Configure Google Auth Provider with additional scopes if needed
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters
googleProvider.setCustomParameters({
  prompt: 'select_account' // Force account selection each time
});

export { auth, googleProvider };
