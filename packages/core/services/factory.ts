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

/**
 * Mock service factory implementation for testing
 */
export class MockServiceFactory extends BaseServiceFactory {
  protected platform: Platform = 'test' as Platform;

  private services: Partial<Services> = {};

  // Basic mock implementations for each service
  getAuthService() {
    if (!this.services.auth) {
      this.services.auth = {
        getCurrentUser: async () => null,
        signInWithEmailPassword: async () => ({ uid: 'mock-uid' }),
        signInWithGoogle: async () => ({ uid: 'mock-uid' }),
        createUser: async () => ({ uid: 'mock-uid' }),
        signOut: async () => undefined,
        onAuthStateChanged: () => () => {},
        getAuthState: () => ({ loading: false, user: null, error: null }),
        isAuthenticated: () => false,
        sendPasswordResetEmail: async () => undefined,
        updatePassword: async () => undefined,
        deleteAccount: async () => undefined,
      };
    }
    return this.services.auth!;
  }

  getUserService() {
    if (!this.services.user) {
      this.services.user = {
        getUserProfile: async () => null,
        updateUserProfile: async () => undefined,
        deleteUserProfile: async () => undefined,
        getUserPreferences: async () => ({}),
        updateUserPreferences: async () => undefined,
      };
    }
    return this.services.user!;
  }

  getSessionService() {
    if (!this.services.session) {
      this.services.session = {
        createSession: async () => ({ id: 'mock-session-id' }),
        getSession: async () => null,
        updateSession: async () => undefined,
        deleteSession: async () => undefined,
        listSessions: async () => [],
        getSessionHistory: async () => [],
      };
    }
    return this.services.session!;
  }

  getAnalysisService() {
    if (!this.services.analysis) {
      this.services.analysis = {
        analyzeAudio: async () => ({}),
        getAnalysisResult: async () => null,
        detectFillerWords: () => [],
        calculateSpeakingRate: () => 0,
        calculateClarityScore: () => 0,
      };
    }
    return this.services.analysis!;
  }

  getFeedbackService() {
    if (!this.services.feedback) {
      this.services.feedback = {
        generateFeedback: async () => ({}),
        getFeedback: async () => null,
        rateFeedback: async () => undefined,
      };
    }
    return this.services.feedback!;
  }

  getLocalStorageService() {
    if (!this.services.localStorage) {
      this.services.localStorage = {
        getItem: async () => null,
        setItem: async () => undefined,
        removeItem: async () => undefined,
        clear: async () => undefined,
        getAllItems: async () => ({}),
      };
    }
    return this.services.localStorage!;
  }

  getRemoteStorageService() {
    if (!this.services.remoteStorage) {
      this.services.remoteStorage = {
        uploadFile: async () => 'mock-url',
        downloadFile: async () => new Blob(),
        deleteFile: async () => undefined,
        getFileMetadata: async () => ({}),
        getDownloadURL: async () => 'mock-url',
      };
    }
    return this.services.remoteStorage!;
  }

  getNetworkService() {
    if (!this.services.network) {
      this.services.network = {
        isOnline: () => true,
        onNetworkStatusChange: () => () => {},
        getNetworkType: () => 'wifi',
      };
    }
    return this.services.network!;
  }

  getSpeechService() {
    if (!this.services.speech) {
      this.services.speech = {
        transcribe: async () => ({ text: 'test transcription' }),
        synthesize: async () => new Blob(),
        getAvailableVoices: () => [],
        getVoicesForLanguage: () => [],
        getVoiceById: () => null,
        cancel: () => {},
        isRecognitionSupported: () => true,
        isSynthesisSupported: () => true,
      };
    }
    return this.services.speech!;
  }

  getAudioService() {
    if (!this.services.audio) {
      this.services.audio = {
        requestPermission: async () => 'granted',
        isRecordingSupported: () => true,
        startRecording: async () => undefined,
        stopRecording: async () => new Blob(),
        pauseRecording: async () => undefined,
        resumeRecording: async () => undefined,
        cancelRecording: async () => undefined,
        getRecordingState: () => 'inactive',
        playAudio: async () => undefined,
        pauseAudio: async () => undefined,
        stopAudio: async () => undefined,
        getPlaybackTime: () => 0,
        setPlaybackTime: async () => undefined,
        getAudioDuration: () => 0,
        isPlaying: () => false,
        getVisualizationData: () => new Uint8Array(),
        convertFormat: async () => new Blob(),
        createAudioUrl: () => 'mock-url',
        revokeAudioUrl: () => {},
      };
    }
    return this.services.audio!;
  }

  getVisualizationService() {
    if (!this.services.visualization) {
      this.services.visualization = {
        createContext: () => ({
          createGradient: () => ({}),
          clearCanvas: () => {},
          fillRect: () => {},
          drawLine: () => {},
          drawWaveform: () => {},
          drawBars: () => {},
          drawText: () => {},
          getCanvas: () => ({}),
        }),
        releaseContext: () => {},
        drawAudioVisualization: () => {},
        drawWordTimings: () => {},
        drawWaveform: () => {},
        createWaveformImage: async () => 'mock-url',
        createSpectrogramImage: async () => 'mock-url',
        isSupported: () => true,
      };
    }
    return this.services.visualization!;
  }
}
