/**
 * Mock Service Factory
 * Provides mock implementations of services for testing
 */

import { 
  ServiceFactory, 
  Platform, 
  Services,
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
  User,
  AuthState
} from '../../services';

/**
 * Mock AuthService implementation
 */
export class MockAuthService implements AuthService {
  private user: User | null = null;
  private authState: AuthState = { 
    user: null, 
    loading: false, 
    error: null 
  };
  
  // Set the mock user for testing
  setMockUser(user: User | null) {
    this.user = user;
    this.authState = {
      user,
      loading: false,
      error: null
    };
  }
  
  // Implementation of AuthService methods
  async getCurrentUser(): Promise<User | null> {
    return this.user;
  }
  
  async signInWithEmailPassword(): Promise<User> {
    if (!this.user) {
      throw new Error('Mock user not set');
    }
    return this.user;
  }
  
  async signInWithGoogle(): Promise<User> {
    if (!this.user) {
      throw new Error('Mock user not set');
    }
    return this.user;
  }
  
  async signOut(): Promise<void> {
    this.user = null;
    this.authState = {
      user: null,
      loading: false,
      error: null
    };
  }
  
  async createUserWithEmailPassword(): Promise<User> {
    if (!this.user) {
      throw new Error('Mock user not set');
    }
    return this.user;
  }
  
  async sendPasswordResetEmail(): Promise<void> {
    // Mock implementation
  }
  
  async updatePassword(): Promise<void> {
    // Mock implementation
  }
  
  async deleteUser(): Promise<void> {
    this.user = null;
  }
  
  onAuthStateChanged(listener: (user: User | null) => void): () => void {
    // Immediately call the listener with the current user
    listener(this.user);
    // Return an unsubscribe function
    return () => {};
  }
  
  getAuthState(): AuthState {
    return this.authState;
  }
  
  async getIdToken(): Promise<string | null> {
    return this.user ? 'mock-token' : null;
  }
  
  async isTokenExpired(): Promise<boolean> {
    return false;
  }
  
  async sendEmailVerification(): Promise<void> {
    // Mock implementation
  }
}

/**
 * Mock LocalStorageService implementation
 */
export class MockLocalStorageService implements LocalStorageService {
  private storage = new Map<string, any>();
  
  async setItem<T>(key: string, data: T): Promise<void> {
    this.storage.set(key, {
      data,
      storedAt: Date.now()
    });
  }
  
  async getItem<T>(key: string): Promise<T | null> {
    const item = this.storage.get(key);
    return item ? item.data : null;
  }
  
  async getItemWithMetadata<T>(key: string): Promise<any> {
    return this.storage.get(key) || null;
  }
  
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    this.storage.clear();
  }
  
  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
  
  async hasItem(key: string): Promise<boolean> {
    return this.storage.has(key);
  }
  
  async isExpired(key: string): Promise<boolean> {
    const item = this.storage.get(key);
    if (!item || !item.expiresAt) {
      return false;
    }
    return item.expiresAt < Date.now();
  }
}

/**
 * Create mocked service instances for testing
 */
export class MockServiceFactory implements ServiceFactory {
  private platform: Platform = 'web';
  
  // Mock services
  private authService = new MockAuthService();
  private localStorage = new MockLocalStorageService();
  
  // Mock minimal implementations of other services
  private userService: UserService = {} as UserService;
  private sessionService: SessionService = {} as SessionService;
  private analysisService: AnalysisService = {} as AnalysisService;
  private feedbackService: FeedbackService = {} as FeedbackService;
  private remoteStorage: RemoteStorageService = {} as RemoteStorageService;
  private networkService: NetworkService = {} as NetworkService;
  private speechService: SpeechService = {} as SpeechService;
  private audioService: AudioService = {} as AudioService;
  
  constructor(platform: Platform = 'web') {
    this.platform = platform;
  }
  
  // Getter methods
  getPlatform(): Platform {
    return this.platform;
  }
  
  getAuthService(): AuthService {
    return this.authService;
  }
  
  getUserService(): UserService {
    return this.userService;
  }
  
  getSessionService(): SessionService {
    return this.sessionService;
  }
  
  getAnalysisService(): AnalysisService {
    return this.analysisService;
  }
  
  getFeedbackService(): FeedbackService {
    return this.feedbackService;
  }
  
  getLocalStorageService(): LocalStorageService {
    return this.localStorage;
  }
  
  getRemoteStorageService(): RemoteStorageService {
    return this.remoteStorage;
  }
  
  getNetworkService(): NetworkService {
    return this.networkService;
  }
  
  getSpeechService(): SpeechService {
    return this.speechService;
  }
  
  getAudioService(): AudioService {
    return this.audioService;
  }
  
  getAllServices(): Services {
    return {
      auth: this.authService,
      user: this.userService,
      session: this.sessionService,
      analysis: this.analysisService,
      feedback: this.feedbackService,
      localStorage: this.localStorage,
      remoteStorage: this.remoteStorage,
      network: this.networkService,
      speech: this.speechService,
      audio: this.audioService
    };
  }
  
  // Methods to set mock instances for specific services
  setMockUserService(service: UserService): void {
    this.userService = service;
  }
  
  setMockSessionService(service: SessionService): void {
    this.sessionService = service;
  }
  
  setMockAnalysisService(service: AnalysisService): void {
    this.analysisService = service;
  }
  
  setMockFeedbackService(service: FeedbackService): void {
    this.feedbackService = service;
  }
  
  setMockRemoteStorageService(service: RemoteStorageService): void {
    this.remoteStorage = service;
  }
  
  setMockNetworkService(service: NetworkService): void {
    this.networkService = service;
  }
  
  setMockSpeechService(service: SpeechService): void {
    this.speechService = service;
  }
  
  setMockAudioService(service: AudioService): void {
    this.audioService = service;
  }
  
  // Helper to set a mock user for testing
  setMockUser(user: User | null): void {
    (this.authService as MockAuthService).setMockUser(user);
  }
}

/**
 * Create a mock service factory for testing
 */
export function createMockServiceFactory(platform: Platform = 'web'): MockServiceFactory {
  return new MockServiceFactory(platform);
}
