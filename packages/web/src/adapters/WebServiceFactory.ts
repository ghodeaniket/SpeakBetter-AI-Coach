/**
 * Web Service Factory
 * Implements service factory for web platform
 */

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
} from '@speakbetter/core/services';

import { WebAuthService } from './auth/WebAuthService';
import { WebUserService } from './user/WebUserService';
import { WebSessionService } from './session/WebSessionService';
import { WebAnalysisService } from './analysis/WebAnalysisService';
import { WebFeedbackService } from './feedback/WebFeedbackService';
import { WebLocalStorageService } from './storage/WebLocalStorageService';
import { WebRemoteStorageService } from './storage/WebRemoteStorageService';
import { WebNetworkService } from './network/WebNetworkService';
import { WebSpeechService } from './speech/WebSpeechService';
import { WebAudioService } from './audio/WebAudioService';

/**
 * Web service factory implementation
 */
export class WebServiceFactory extends BaseServiceFactory {
  protected platform: Platform = 'web';
  
  // Singleton instances
  private static authService: AuthService;
  private static userService: UserService;
  private static sessionService: SessionService;
  private static analysisService: AnalysisService;
  private static feedbackService: FeedbackService;
  private static localStorageService: LocalStorageService;
  private static remoteStorageService: RemoteStorageService;
  private static networkService: NetworkService;
  private static speechService: SpeechService;
  private static audioService: AudioService;
  
  /**
   * Get an auth service instance
   */
  getAuthService(): AuthService {
    if (!WebServiceFactory.authService) {
      WebServiceFactory.authService = new WebAuthService();
    }
    return WebServiceFactory.authService;
  }
  
  /**
   * Get a user service instance
   */
  getUserService(): UserService {
    if (!WebServiceFactory.userService) {
      WebServiceFactory.userService = new WebUserService(
        this.getAuthService()
      );
    }
    return WebServiceFactory.userService;
  }
  
  /**
   * Get a session service instance
   */
  getSessionService(): SessionService {
    if (!WebServiceFactory.sessionService) {
      WebServiceFactory.sessionService = new WebSessionService(
        this.getAuthService()
      );
    }
    return WebServiceFactory.sessionService;
  }
  
  /**
   * Get an analysis service instance
   */
  getAnalysisService(): AnalysisService {
    if (!WebServiceFactory.analysisService) {
      WebServiceFactory.analysisService = new WebAnalysisService(
        this.getAuthService()
      );
    }
    return WebServiceFactory.analysisService;
  }
  
  /**
   * Get a feedback service instance
   */
  getFeedbackService(): FeedbackService {
    if (!WebServiceFactory.feedbackService) {
      WebServiceFactory.feedbackService = new WebFeedbackService(
        this.getAuthService(),
        this.getSpeechService()
      );
    }
    return WebServiceFactory.feedbackService;
  }
  
  /**
   * Get a local storage service instance
   */
  getLocalStorageService(): LocalStorageService {
    if (!WebServiceFactory.localStorageService) {
      WebServiceFactory.localStorageService = new WebLocalStorageService();
    }
    return WebServiceFactory.localStorageService;
  }
  
  /**
   * Get a remote storage service instance
   */
  getRemoteStorageService(): RemoteStorageService {
    if (!WebServiceFactory.remoteStorageService) {
      WebServiceFactory.remoteStorageService = new WebRemoteStorageService(
        this.getAuthService()
      );
    }
    return WebServiceFactory.remoteStorageService;
  }
  
  /**
   * Get a network service instance
   */
  getNetworkService(): NetworkService {
    if (!WebServiceFactory.networkService) {
      WebServiceFactory.networkService = new WebNetworkService();
    }
    return WebServiceFactory.networkService;
  }
  
  /**
   * Get a speech service instance
   */
  getSpeechService(): SpeechService {
    if (!WebServiceFactory.speechService) {
      WebServiceFactory.speechService = new WebSpeechService(
        this.getNetworkService()
      );
    }
    return WebServiceFactory.speechService;
  }
  
  /**
   * Get an audio service instance
   */
  getAudioService(): AudioService {
    if (!WebServiceFactory.audioService) {
      WebServiceFactory.audioService = new WebAudioService();
    }
    return WebServiceFactory.audioService;
  }
}

/**
 * Create and export a singleton instance of the web service factory
 */
export const webServiceFactory = new WebServiceFactory();
