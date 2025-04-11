import { 
  BaseServiceFactory, 
  Platform, 
  AuthService, 
  UserService, 
  SessionService, 
  AnalysisService, 
  FeedbackService, 
  LocalStorageService, 
  RemoteStorageService, 
  NetworkService, 
  SpeechService, 
  AudioService 
} from '@speakbetter/core';
import { 
  createFirebaseAuthService, 
  createFirebaseUserService,
  createIndexedDBStorage,
  createFirebaseStorageService
} from '@speakbetter/api';
import { FirebaseApp, initializeApp } from 'firebase/app';

/**
 * Web-specific configuration for services
 */
export interface WebServiceConfig {
  /**
   * Firebase configuration
   */
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  
  /**
   * IndexedDB configuration
   */
  indexedDB: {
    dbName: string;
    dbVersion?: number;
    storeName: string;
  };
}

/**
 * Web-specific implementation of the service factory
 */
export class WebServiceFactory extends BaseServiceFactory {
  protected platform: Platform = 'web';
  private config: WebServiceConfig;
  private firebaseApp: FirebaseApp;
  
  // Service instances
  private authServiceInstance: AuthService | null = null;
  private userServiceInstance: UserService | null = null;
  private localStorageServiceInstance: LocalStorageService | null = null;
  private remoteStorageServiceInstance: RemoteStorageService | null = null;
  
  constructor(config: WebServiceConfig) {
    super();
    this.config = config;
    this.firebaseApp = initializeApp(config.firebase);
  }
  
  /**
   * Get the authentication service instance
   */
  getAuthService(): AuthService {
    if (!this.authServiceInstance) {
      this.authServiceInstance = createFirebaseAuthService({
        apiKey: this.config.firebase.apiKey,
        authDomain: this.config.firebase.authDomain,
        projectId: this.config.firebase.projectId
      });
    }
    return this.authServiceInstance;
  }
  
  /**
   * Get the user service instance
   */
  getUserService(): UserService {
    if (!this.userServiceInstance) {
      this.userServiceInstance = createFirebaseUserService(this.firebaseApp);
    }
    return this.userServiceInstance;
  }
  
  /**
   * Get the local storage service instance
   */
  getLocalStorageService(): LocalStorageService {
    if (!this.localStorageServiceInstance) {
      this.localStorageServiceInstance = createIndexedDBStorage(this.config.indexedDB);
    }
    return this.localStorageServiceInstance;
  }
  
  /**
   * Get the remote storage service instance
   */
  getRemoteStorageService(): RemoteStorageService {
    if (!this.remoteStorageServiceInstance) {
      this.remoteStorageServiceInstance = createFirebaseStorageService();
    }
    return this.remoteStorageServiceInstance;
  }
  
  /**
   * These services are planned for later phases, so we'll return
   * placeholder implementations for now
   */
  getSessionService(): SessionService {
    throw new Error('Session service not implemented in phase 2');
  }
  
  getAnalysisService(): AnalysisService {
    throw new Error('Analysis service not implemented in phase 2');
  }
  
  getFeedbackService(): FeedbackService {
    throw new Error('Feedback service not implemented in phase 2');
  }
  
  getNetworkService(): NetworkService {
    throw new Error('Network service not implemented in phase 2');
  }
  
  getSpeechService(): SpeechService {
    throw new Error('Speech service not implemented in phase 2');
  }
  
  getAudioService(): AudioService {
    throw new Error('Audio service not implemented in phase 2');
  }
}

/**
 * Create a web service factory instance
 */
export function createWebServiceFactory(config: WebServiceConfig): WebServiceFactory {
  return new WebServiceFactory(config);
}
