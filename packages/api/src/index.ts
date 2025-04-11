// API service exports

// Firebase exports
export * from './firebase';

// Speech exports
export * from './speech';

// Storage exports
export * from './storage';

// Factory function to create all services
import { AuthService, SpeechService, StorageService } from '@speakbetter/core';
import { createFirebaseAuthService } from './firebase';
import { createGoogleSpeechService } from './speech';
import { createFirebaseStorageService } from './storage';

/**
 * Service factory interface
 */
export interface ServiceFactory {
  createAuthService(): AuthService;
  createSpeechService(): SpeechService;
  createStorageService(): StorageService;
}

/**
 * Default service factory implementation using Firebase and Google Cloud
 */
export class DefaultServiceFactory implements ServiceFactory {
  createAuthService(): AuthService {
    return createFirebaseAuthService();
  }
  
  createSpeechService(): SpeechService {
    return createGoogleSpeechService();
  }
  
  createStorageService(): StorageService {
    return createFirebaseStorageService();
  }
}

/**
 * Create a default service factory
 */
export function createServiceFactory(): ServiceFactory {
  return new DefaultServiceFactory();
}
