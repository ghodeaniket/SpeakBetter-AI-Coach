import { useContext, createContext, ReactNode, useState, useEffect } from 'react';
import { 
  setServiceFactory, 
  getService,
  AuthService,
  UserService,
  LocalStorageService,
  RemoteStorageService,
  User
} from '@speakbetter/core';
import { createWebServiceFactory, WebServiceConfig } from '../services/WebServiceFactory';

// Service context type
interface ServiceContextType {
  isInitialized: boolean;
  authService: AuthService | null;
  userService: UserService | null;
  localStorageService: LocalStorageService | null;
  remoteStorageService: RemoteStorageService | null;
  currentUser: User | null;
  isLoading: boolean;
  error: Error | null;
}

// Create the service context
const ServiceContext = createContext<ServiceContextType>({
  isInitialized: false,
  authService: null,
  userService: null,
  localStorageService: null,
  remoteStorageService: null,
  currentUser: null,
  isLoading: true,
  error: null
});

/**
 * Service provider properties
 */
export interface ServiceProviderProps {
  config: WebServiceConfig;
  children: ReactNode;
}

/**
 * Service provider component
 */
export function ServiceProvider({ config, children }: ServiceProviderProps) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [services, setServices] = useState<{
    authService: AuthService | null;
    userService: UserService | null;
    localStorageService: LocalStorageService | null;
    remoteStorageService: RemoteStorageService | null;
  }>({
    authService: null,
    userService: null,
    localStorageService: null,
    remoteStorageService: null
  });
  
  useEffect(() => {
    // Initialize services
    try {
      const serviceFactory = createWebServiceFactory(config);
      setServiceFactory(serviceFactory);
      
      const authService = serviceFactory.getAuthService();
      const userService = serviceFactory.getUserService();
      const localStorageService = serviceFactory.getLocalStorageService();
      const remoteStorageService = serviceFactory.getRemoteStorageService();
      
      setServices({
        authService,
        userService,
        localStorageService,
        remoteStorageService
      });
      
      // Listen for auth state changes
      const unsubscribe = authService.onAuthStateChanged((user) => {
        setCurrentUser(user);
        setIsLoading(false);
      });
      
      setIsInitialized(true);
      
      // Cleanup
      return () => {
        unsubscribe();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize services'));
      setIsLoading(false);
    }
  }, [config]);
  
  // Context value
  const value: ServiceContextType = {
    isInitialized,
    authService: services.authService,
    userService: services.userService,
    localStorageService: services.localStorageService,
    remoteStorageService: services.remoteStorageService,
    currentUser,
    isLoading,
    error
  };
  
  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access services
 */
export function useServices() {
  const context = useContext(ServiceContext);
  
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  
  return context;
}

/**
 * Hook to access authentication service
 */
export function useAuth() {
  const { authService, currentUser, isLoading, error } = useServices();
  
  if (!authService) {
    throw new Error('Auth service is not initialized');
  }
  
  return {
    authService,
    currentUser,
    isLoading,
    error,
    isAuthenticated: !!currentUser,
    signIn: authService.signInWithEmailPassword.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signOut: authService.signOut.bind(authService),
    getIdToken: authService.getIdToken.bind(authService)
  };
}

/**
 * Hook to access user service
 */
export function useUser() {
  const { userService, currentUser } = useServices();
  
  if (!userService) {
    throw new Error('User service is not initialized');
  }
  
  if (!currentUser) {
    throw new Error('No authenticated user');
  }
  
  return {
    userService,
    currentUser,
    getUserProfile: () => userService.getUserById(currentUser.uid),
    updateUserProfile: (data: any) => userService.updateUser(currentUser.uid, data),
    getUserSettings: () => userService.getUserSettings(currentUser.uid),
    updateUserSettings: (settings: any) => userService.updateUserSettings(currentUser.uid, settings)
  };
}

/**
 * Hook to access storage services
 */
export function useStorage() {
  const { localStorageService, remoteStorageService } = useServices();
  
  if (!localStorageService || !remoteStorageService) {
    throw new Error('Storage services are not initialized');
  }
  
  return {
    localStorage: localStorageService,
    remoteStorage: remoteStorageService
  };
}
