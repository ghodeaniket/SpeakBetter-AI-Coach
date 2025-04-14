/**
 * Mobile Service Factory
 * Implements service factory for mobile platform using React Native
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
  AudioService,
  VisualizationService,
} from "@speakbetter/core/services";

// Import mobile-specific adapter implementations
import { MobileAudioAdapter } from "./MobileAudioAdapter";
import { MobileSpeechAdapter } from "./MobileSpeechAdapter";
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter";
import { UserProfileAdapter } from "./UserProfileAdapter";
import { MobileNetworkAdapter } from "./MobileNetworkAdapter";
import { MobileLocalStorageAdapter } from "./MobileLocalStorageAdapter";
import { MobileRemoteStorageAdapter } from "./MobileRemoteStorageAdapter";
import { MobileSessionAdapter } from "./MobileSessionAdapter";
import { MobileAnalysisAdapter } from "./MobileAnalysisAdapter";
import { MobileFeedbackAdapter } from "./MobileFeedbackAdapter";
import { MobileVisualizationAdapter } from "./MobileVisualizationAdapter";

/**
 * Mobile service factory implementation
 */
export class MobileServiceFactory extends BaseServiceFactory {
  protected platform: Platform = "mobile";

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
  private static visualizationService: VisualizationService;

  /**
   * Get an auth service instance
   */
  getAuthService(): AuthService {
    if (!MobileServiceFactory.authService) {
      MobileServiceFactory.authService = new FirebaseAuthAdapter();
    }
    return MobileServiceFactory.authService;
  }

  /**
   * Get a user service instance
   */
  getUserService(): UserService {
    if (!MobileServiceFactory.userService) {
      MobileServiceFactory.userService = new UserProfileAdapter(
        this.getAuthService(),
      );
    }
    return MobileServiceFactory.userService;
  }

  /**
   * Get a session service instance
   */
  getSessionService(): SessionService {
    if (!MobileServiceFactory.sessionService) {
      MobileServiceFactory.sessionService = new MobileSessionAdapter(
        this.getAuthService(),
      );
    }
    return MobileServiceFactory.sessionService;
  }

  /**
   * Get an analysis service instance
   */
  getAnalysisService(): AnalysisService {
    if (!MobileServiceFactory.analysisService) {
      MobileServiceFactory.analysisService = new MobileAnalysisAdapter(
        this.getAuthService(),
        this.getSpeechService(),
      );
    }
    return MobileServiceFactory.analysisService;
  }

  /**
   * Get a feedback service instance
   */
  getFeedbackService(): FeedbackService {
    if (!MobileServiceFactory.feedbackService) {
      MobileServiceFactory.feedbackService = new MobileFeedbackAdapter(
        this.getAuthService(),
        this.getSpeechService(),
      );
    }
    return MobileServiceFactory.feedbackService;
  }

  /**
   * Get a local storage service instance
   */
  getLocalStorageService(): LocalStorageService {
    if (!MobileServiceFactory.localStorageService) {
      MobileServiceFactory.localStorageService =
        new MobileLocalStorageAdapter();
    }
    return MobileServiceFactory.localStorageService;
  }

  /**
   * Get a remote storage service instance
   */
  getRemoteStorageService(): RemoteStorageService {
    if (!MobileServiceFactory.remoteStorageService) {
      MobileServiceFactory.remoteStorageService =
        new MobileRemoteStorageAdapter(this.getAuthService());
    }
    return MobileServiceFactory.remoteStorageService;
  }

  /**
   * Get a network service instance
   */
  getNetworkService(): NetworkService {
    if (!MobileServiceFactory.networkService) {
      MobileServiceFactory.networkService = new MobileNetworkAdapter();
    }
    return MobileServiceFactory.networkService;
  }

  /**
   * Get a speech service instance
   */
  getSpeechService(): SpeechService {
    if (!MobileServiceFactory.speechService) {
      MobileServiceFactory.speechService = new MobileSpeechAdapter(
        this.getNetworkService(),
      );
    }
    return MobileServiceFactory.speechService;
  }

  /**
   * Get an audio service instance
   */
  getAudioService(): AudioService {
    if (!MobileServiceFactory.audioService) {
      MobileServiceFactory.audioService = new MobileAudioAdapter();
    }
    return MobileServiceFactory.audioService;
  }

  /**
   * Get a visualization service instance
   */
  getVisualizationService(): VisualizationService {
    if (!MobileServiceFactory.visualizationService) {
      MobileServiceFactory.visualizationService =
        new MobileVisualizationAdapter();
    }
    return MobileServiceFactory.visualizationService;
  }
}

/**
 * Create and export a singleton instance of the mobile service factory
 */
export const mobileServiceFactory = new MobileServiceFactory();
