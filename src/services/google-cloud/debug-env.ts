// Log environment variables to help debug
console.log('Environment Variables:');
console.log('VITE_GOOGLE_CLOUD_API_KEY:', import.meta.env.VITE_GOOGLE_CLOUD_API_KEY);
console.log('VITE_GOOGLE_CLOUD_PROJECT_ID:', import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID);
console.log('All env variables:', import.meta.env);

// If the key starts with 'Y', it might be a typo
if (import.meta.env.VITE_GOOGLE_CLOUD_API_KEY?.toString().startsWith('Y')) {
  console.warn('API key appears to have a typo - should start with "AIza"');
}

export default {};
