// Google Cloud API authentication helper
import { auth as firebaseAuth } from '../../firebase/config';
import { getIdToken } from 'firebase/auth';

/**
 * Get Firebase ID token for authenticating with Google Cloud APIs
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const currentUser = firebaseAuth.currentUser;
    
    if (!currentUser) {
      console.warn('No user is currently signed in');
      return null;
    }
    
    const token = await getIdToken(currentUser, true);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get auth headers for Google Cloud API requests
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  
  if (!token) {
    // Return empty headers if no token
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`,
  };
};

export default {
  getAuthToken,
  getAuthHeaders,
};
