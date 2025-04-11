/**
 * Service Factory
 * Provides a way to get service instances with dependency injection
 */

import { AuthService } from './auth';
import { UserService } from './user';
import { SessionService } from './session';
import { AnalysisService } from './analysis';
import { FeedbackService } from './feedback';
import { LocalStorageService, RemoteStorageService } from './storage';
import { NetworkService } from './network';
import { SpeechService } from './speech';
import { AudioService } from './audio';
import { VisualizationService } from './visualization';

/**
 * Platform type
 */
export type Platform = 'web' | 'mobile' | 'desktop';

/**
 * Service types
 */
export interface Services {
  auth: AuthService;
  user: UserService;
  session: SessionService;
  analysis: AnalysisService;
  feedback: FeedbackService;
  localStorage: LocalStorageService;
  remoteStorage: RemoteStorageService;
  network: NetworkService;
  speech: SpeechService;
  audio: AudioService;
  visualization: VisualizationService;
}

/**
 * Service factory interface
 * Creates service instances for the specified platform
 */
export interface ServiceFactory {
  /**
   * Get the current platform
   */
  getPlatform(): Platform;
  
  /**
   * Get an auth service instance
   */
  getAuthService(): AuthService;
  
  /**
   * Get a user service instance
   */
  getUserService(): UserService;
  
  /**
   * Get a session service instance
   */
  getSessionService(): SessionService;
  
  /**
   * Get an analysis service instance
   */
  getAnalysisService(): AnalysisService;
  
  /**
   * Get a feedback service instance
   */
  getFeedbackService(): FeedbackService;
  
  /**
   * Get a local storage service instance
   */
  getLocalStorageService(): LocalStorageService;
  
  /**
   * Get a remote storage service instance
   */
  getRemoteStorageService(): RemoteStorageService;
  
  /**
   * Get a network service instance
   */
  getNetworkService(): NetworkService;
  
  /**
   * Get a speech service instance
   */
  getSpeechService(): SpeechService;
  
  /**
   * Get an audio service instance
   */
  getAudioService(): AudioService;
  
  /**
   * Get a visualization service instance
   */
  getVisualizationService(): VisualizationService;
  
  /**
   * Get all service instances
   */
  getAllServices(): Services;
}

/**
 * Abstract service factory base class
 */
export abstract class BaseServiceFactory implements ServiceFactory {
  protected abstract platform: Platform;
  
  /**
   * Get the current platform
   */
  getPlatform(): Platform {
    return this.platform;
  }
  
  /**
   * Get an auth service instance
   */
  abstract getAuthService(): AuthService;
  
  /**
   * Get a user service instance
   */
  abstract getUserService(): UserService;
  
  /**
   * Get a session service instance
   */
  abstract getSessionService(): SessionService;
  
  /**
   * Get an analysis service instance
   */
  abstract getAnalysisService(): AnalysisService;
  
  /**
   * Get a feedback service instance
   */
  abstract getFeedbackService(): FeedbackService;
  
  /**
   * Get a local storage service instance
   */
  abstract getLocalStorageService(): LocalStorageService;
  
  /**
   * Get a remote storage service instance
   */
  abstract getRemoteStorageService(): RemoteStorageService;
  
  /**
   * Get a network service instance
   */
  abstract getNetworkService(): NetworkService;
  
  /**
   * Get a speech service instance
   */
  abstract getSpeechService(): SpeechService;
  
  /**
   * Get an audio service instance
   */
  abstract getAudioService(): AudioService;
  
  /**
   * Get a visualization service instance
   */
  abstract getVisualizationService(): VisualizationService;
  
  /**
   * Get all service instances
   */
  getAllServices(): Services {
    return {
      auth: this.getAuthService(),
      user: this.getUserService(),
      session: this.getSessionService(),
      analysis: this.getAnalysisService(),
      feedback: this.getFeedbackService(),
      localStorage: this.getLocalStorageService(),
      remoteStorage: this.getRemoteStorageService(),
      network: this.getNetworkService(),
      speech: this.getSpeechService(),
      audio: this.getAudioService(),
      visualization: this.getVisualizationService(),
    };
  }
}

/**
 * Service factory instance
 * Set by the platform-specific implementation during initialization
 */
let serviceFactoryInstance: ServiceFactory | null = null;

/**
 * Set the service factory instance
 */
export function setServiceFactory(factory: ServiceFactory): void {
  serviceFactoryInstance = factory;
}

/**
 * Get the service factory instance
 */
export function getServiceFactory(): ServiceFactory {
  if (!serviceFactoryInstance) {
    throw new Error('Service factory not initialized');
  }
  return serviceFactoryInstance;
}

/**
 * Get a specific service instance
 */
export function getService<K extends keyof Services>(serviceType: K): Services[K] {
  const factory = getServiceFactory();
  const services = factory.getAllServices();
  return services[serviceType];
}
