/**
 * Web Adapters Index
 * Exports all web platform service implementations
 */

// Export service factory
export { WebServiceFactory, webServiceFactory } from './WebServiceFactory';

// Export individual services
export { WebAuthService } from './auth/WebAuthService';
export { WebUserService } from './user/WebUserService';
export { WebLocalStorageService } from './storage/WebLocalStorageService';
export { WebRemoteStorageService } from './storage/WebRemoteStorageService';
export { WebNetworkService } from './network/WebNetworkService';
export { WebAudioService } from './audio/WebAudioService';

// Initialize the service factory
import { setServiceFactory } from '@speakbetter/core/services';
import { webServiceFactory } from './WebServiceFactory';

// Set the service factory singleton for the application
setServiceFactory(webServiceFactory);

// Export a function to initialize all services
export function initializeServices(): void {
  // This function is called at application startup
  // to ensure that all services are properly initialized
  setServiceFactory(webServiceFactory);
  
  // Perform any additional initialization if needed
  console.log('Web services initialized');
}
