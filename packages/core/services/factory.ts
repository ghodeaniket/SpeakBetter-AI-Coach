/**
 * Service Factory
 * Provides a way to get service instances with dependency injection
 */

import { AuthService, AuthStateListener, AuthState } from './auth';
import { UserService } from './user';
import { SessionService, SessionQueryOptions } from './session';
import { AnalysisService } from './analysis';
import { FeedbackService, FeedbackQueryOptions, FeedbackGenerationParams, TextFeedback } from './feedback';
import { LocalStorageService, RemoteStorageService } from './storage';
import { NetworkService } from './network';
import { SpeechService, TranscriptionResult, VoiceInfo } from './speech';
import { AudioService, AudioRecordingState, AudioVisualizationData } from './audio';
import { VisualizationService, VisualizationContext } from './visualization';
import { User, UserSettings, UserCredentials, UserCreateRequest, UserUpdateRequest } from '../models/user';
import { Session, SessionType, SessionStatus, SessionCreateRequest, SessionUpdateRequest } from '../models/session';
import { Feedback, FeedbackCreateRequest, FeedbackUpdateRequest } from '../models/feedback';
import { Analysis } from '../models/analysis';
import { AppError } from '../models/error';

/**
 * Platform type
 */
export type Platform = 'web' | 'mobile' | 'desktop' | 'test';

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
  protected platform: Platform = 'test';
  private services: Partial<Services> = {};

  // Basic mock implementations for each service
  getAuthService(): AuthService {
    if (!this.services.auth) {
      this.services.auth = {
        getCurrentUser: async () => null,
        signInWithEmailPassword: async (): Promise<User> => {
          return {
            uid: 'mock-uid',
            displayName: 'Mock User',
            email: 'mock@example.com',
            photoURL: null,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            settings: {
              selectedVoice: 'default',
              coachPersonality: 'supportive',
              notificationPreferences: {
                email: false,
                inApp: true,
                practiceDays: ['monday', 'wednesday', 'friday']
              }
            },
            emailVerified: false
          };
        },
        signInWithGoogle: async (): Promise<User> => {
          return {
            uid: 'mock-uid',
            displayName: 'Mock User',
            email: 'mock@example.com',
            photoURL: null,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            settings: {
              selectedVoice: 'default',
              coachPersonality: 'supportive',
              notificationPreferences: {
                email: false,
                inApp: true,
                practiceDays: ['monday', 'wednesday', 'friday']
              }
            },
            emailVerified: false
          };
        },
        signOut: async () => undefined,
        createUserWithEmailPassword: async (): Promise<User> => {
          return {
            uid: 'mock-uid',
            displayName: 'Mock User',
            email: 'mock@example.com',
            photoURL: null,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            settings: {
              selectedVoice: 'default',
              coachPersonality: 'supportive',
              notificationPreferences: {
                email: false,
                inApp: true,
                practiceDays: ['monday', 'wednesday', 'friday']
              }
            },
            emailVerified: false
          };
        },
        onAuthStateChanged: () => () => {},
        getAuthState: () => ({ loading: false, user: null, error: null }),
        sendPasswordResetEmail: async () => undefined,
        updatePassword: async () => undefined,
        deleteUser: async () => undefined,
        getIdToken: async () => null,
        isTokenExpired: async () => false,
        sendEmailVerification: async () => undefined
      };
    }
    return this.services.auth as AuthService;
  }

  getUserService(): UserService {
    if (!this.services.user) {
      this.services.user = {
        getUserById: async () => null,
        createUser: async (): Promise<User> => ({
          uid: 'mock-uid',
          displayName: 'Mock User',
          email: 'mock@example.com',
          photoURL: null,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          settings: {
            selectedVoice: 'default',
            coachPersonality: 'supportive',
            notificationPreferences: {
              email: false,
              inApp: true,
              practiceDays: ['monday', 'wednesday', 'friday']
            }
          },
          emailVerified: false
        }),
        updateUser: async () => ({
          uid: 'mock-uid',
          displayName: 'Mock User',
          email: 'mock@example.com',
          photoURL: null,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          settings: {
            selectedVoice: 'default',
            coachPersonality: 'supportive',
            notificationPreferences: {
              email: false,
              inApp: true,
              practiceDays: ['monday', 'wednesday', 'friday']
            }
          },
          emailVerified: false
        }),
        deleteUser: async () => undefined,
        getUserSettings: async () => ({
          selectedVoice: 'default',
          coachPersonality: 'supportive',
          notificationPreferences: {
            email: false,
            inApp: true,
            practiceDays: ['monday', 'wednesday', 'friday']
          }
        }),
        updateUserSettings: async () => ({
          selectedVoice: 'default',
          coachPersonality: 'supportive',
          notificationPreferences: {
            email: false,
            inApp: true,
            practiceDays: ['monday', 'wednesday', 'friday']
          }
        }),
        userExists: async () => false,
        getLastLoginTime: async () => new Date(),
        updateLastLoginTime: async () => undefined
      };
    }
    return this.services.user as UserService;
  }

  getSessionService(): SessionService {
    if (!this.services.session) {
      const mockDate = new Date();
      this.services.session = {
        getSessionById: async () => null,
        getUserSessions: async () => [],
        createSession: async (): Promise<Session> => {
          return {
            id: 'mock-session-id',
            userId: 'mock-user-id',
            type: SessionType.FREESTYLE,
            title: 'Mock Session',
            status: SessionStatus.COMPLETED,
            durationSeconds: 120,
            createdAt: mockDate,
            updatedAt: mockDate,
            hasAnalysis: false,
            hasFeedback: false
          };
        },
        updateSession: async (id: string): Promise<Session> => {
          return {
            id,
            userId: 'mock-user-id',
            type: SessionType.FREESTYLE,
            title: 'Mock Session',
            status: SessionStatus.COMPLETED,
            durationSeconds: 120,
            createdAt: mockDate,
            updatedAt: mockDate,
            hasAnalysis: false,
            hasFeedback: false
          };
        },
        deleteSession: async () => undefined,
        getLatestSession: async () => null,
        countUserSessions: async () => 0,
        markSessionHasAnalysis: async () => undefined,
        markSessionHasFeedback: async () => undefined,
        updateSessionStatus: async () => undefined,
        onSessionUpdated: () => () => {}
      };
    }
    return this.services.session as SessionService;
  }

  getAnalysisService(): AnalysisService {
    if (!this.services.analysis) {
      this.services.analysis = {
        getAnalysisBySessionId: async () => null,
        createAnalysis: async () => ({} as Analysis),
        updateAnalysis: async () => ({} as Analysis),
        deleteAnalysis: async () => undefined,
        getSessionTranscription: async () => '',
        detectFillerWords: () => [],
        calculateSpeakingRate: () => 0,
        calculateClarityScore: () => 0,
      };
    }
    return this.services.analysis as AnalysisService;
  }

  getFeedbackService(): FeedbackService {
    if (!this.services.feedback) {
      this.services.feedback = {
        getFeedbackById: async () => null,
        getFeedbackBySessionId: async () => null,
        getUserFeedback: async () => [],
        createFeedback: async (): Promise<Feedback> => ({
          id: 'mock-feedback-id',
          sessionId: 'mock-session-id',
          userId: 'mock-user-id',
          analysisId: 'mock-analysis-id',
          textFeedback: {
            positive: 'Good job!',
            improvement: 'Try to speak more clearly.',
            suggestion: 'Practice regularly.',
            encouragement: 'Keep it up!'
          },
          audioFeedbackUrl: 'mock-url',
          createdAt: new Date(),
          viewedAt: undefined
        }),
        updateFeedback: async () => ({} as Feedback),
        deleteFeedback: async () => undefined,
        markFeedbackViewed: async () => undefined,
        rateFeedback: async () => undefined,
        generateTextFeedback: async (): Promise<TextFeedback> => ({
          positive: 'Good job!',
          improvement: 'Try to speak more clearly.',
          suggestion: 'Practice regularly.',
          encouragement: 'Keep it up!'
        }),
        generateAudioFeedback: async () => 'mock-url',
        generateComprehensiveFeedback: async () => ({
          textFeedback: {
            positive: 'Good job!',
            improvement: 'Try to speak more clearly.',
            suggestion: 'Practice regularly.',
            encouragement: 'Keep it up!'
          },
          audioFeedbackUrl: 'mock-url'
        })
      };
    }
    return this.services.feedback as FeedbackService;
  }

  getLocalStorageService(): LocalStorageService {
    if (!this.services.localStorage) {
      this.services.localStorage = {
        getItem: async () => null,
        setItem: async () => undefined,
        removeItem: async () => undefined,
        clear: async () => undefined,
        getItemWithMetadata: async () => null,
        getAllKeys: async () => [],
        hasItem: async () => false,
        isExpired: async () => false
      };
    }
    return this.services.localStorage as LocalStorageService;
  }

  getRemoteStorageService(): RemoteStorageService {
    if (!this.services.remoteStorage) {
      this.services.remoteStorage = {
        uploadFile: async () => 'mock-url',
        downloadFile: async () => new Blob(),
        deleteFile: async () => undefined,
        getFileMetadata: async () => ({}),
        getDownloadUrl: async () => 'mock-url',
        listFiles: async () => [],
        updateFileMetadata: async () => undefined
      };
    }
    return this.services.remoteStorage as RemoteStorageService;
  }

  getNetworkService(): NetworkService {
    if (!this.services.network) {
      this.services.network = {
        isOnline: () => true,
        onNetworkStateChanged: () => () => {},
        getNetworkStatus: () => ({ isOnline: true, type: 'wifi', isSlowConnection: false }),
        isSlowConnection: () => false,
        isApiReachable: async () => true,
        waitForConnection: async () => undefined,
        retry: async (fn) => fn()
      };
    }
    return this.services.network as NetworkService;
  }

  getSpeechService(): SpeechService {
    if (!this.services.speech) {
      this.services.speech = {
        transcribe: async (): Promise<TranscriptionResult> => ({ 
          text: 'test transcription',
          confidence: 0.9,
          wordTimings: [],
          languageCode: 'en-US',
          durationSeconds: 2
        }),
        synthesize: async () => new Blob(),
        getAvailableVoices: async (): Promise<VoiceInfo[]> => [],
        getVoicesForLanguage: async (): Promise<VoiceInfo[]> => [],
        getVoiceById: async (): Promise<VoiceInfo | null> => null,
        cancel: () => {},
        isRecognitionSupported: () => true,
        isSynthesisSupported: () => true,
      };
    }
    return this.services.speech as SpeechService;
  }

  getAudioService(): AudioService {
    if (!this.services.audio) {
      const recordingState: AudioRecordingState = {
        isRecording: false,
        durationSeconds: 0,
        audioLevel: 0,
        isProcessing: false,
        isSilent: false,
        error: null
      };

      const visualizationData: AudioVisualizationData = {
        frequencyData: new Uint8Array(),
        timeData: new Uint8Array(),
        averageLevel: 0,
        peakLevel: 0
      };

      this.services.audio = {
        requestPermission: async () => true,
        isRecordingSupported: () => true,
        startRecording: async () => undefined,
        stopRecording: async () => new Blob(),
        pauseRecording: async () => undefined,
        resumeRecording: async () => undefined,
        cancelRecording: () => undefined,
        getRecordingState: () => recordingState,
        playAudio: async () => undefined,
        pauseAudio: () => undefined,
        stopAudio: () => undefined,
        getPlaybackTime: () => 0,
        setPlaybackTime: async () => undefined,
        getAudioDuration: () => 0,
        isPlaying: () => false,
        getVisualizationData: () => visualizationData,
        convertFormat: async () => new Blob(),
        createAudioUrl: () => 'mock-url',
        revokeAudioUrl: () => {},
      };
    }
    return this.services.audio as AudioService;
  }

  getVisualizationService(): VisualizationService {
    if (!this.services.visualization) {
      const mockVisualizationContext: VisualizationContext = {
        clear: () => {},
        setFillStyle: () => {},
        setStrokeStyle: () => {},
        setLineWidth: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        rect: () => {},
        roundedRect: () => {},
        fill: () => {},
        stroke: () => {},
        createLinearGradient: () => ({
          addColorStop: () => {}
        }),
        createRadialGradient: () => ({
          addColorStop: () => {}
        }),
        fillText: () => {},
        setTextAlign: () => {},
        setTextBaseline: () => {},
        setFont: () => {},
        save: () => {},
        restore: () => {}
      };

      this.services.visualization = {
        createContext: () => mockVisualizationContext,
        releaseContext: () => {},
        drawAudioVisualization: () => {},
        drawWordTimings: () => {},
        drawWaveform: () => {},
        createWaveformImage: async () => 'mock-url',
        createSpectrogramImage: async () => 'mock-url',
        isSupported: () => true,
      };
    }
    return this.services.visualization as VisualizationService;
  }
}