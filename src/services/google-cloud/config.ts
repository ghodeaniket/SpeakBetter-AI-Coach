/**
 * Google Cloud API configuration
 */

// Get API key from environment variables
export const GOOGLE_CLOUD_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

// Project ID from environment variables
export const GOOGLE_CLOUD_PROJECT_ID = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID;

// Check if API key is available
if (!GOOGLE_CLOUD_API_KEY) {
  console.warn('Google Cloud API key is not set. Speech services will not work properly.');
}

// Check if Project ID is available
if (!GOOGLE_CLOUD_PROJECT_ID) {
  console.warn('Google Cloud Project ID is not set.');
}

export default {
  apiKey: GOOGLE_CLOUD_API_KEY,
  projectId: GOOGLE_CLOUD_PROJECT_ID
};
