/**
 * Service Provider Component
 * Provides access to services throughout the React application
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { getServiceFactory, Services } from '@speakbetter/core/services';
import { initializeServices } from '../adapters';

// Initialize services when this file is imported
initializeServices();

// Create service context
const ServiceContext = createContext<Services | null>(null);

/**
 * Props for ServiceProvider component
 */
interface ServiceProviderProps {
  /**
   * Children to render inside the provider
   */
  children: ReactNode;
}

/**
 * Service Provider Component
 * Makes services available to all components in the application
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  // Get all services from the factory
  const services = useMemo(() => {
    const factory = getServiceFactory();
    return factory.getAllServices();
  }, []);
  
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

/**
 * Custom hook to use services in components
 */
export function useServices(): Services {
  const context = useContext(ServiceContext);
  
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  
  return context;
}

/**
 * Custom hook to use a specific service
 */
export function useService<K extends keyof Services>(serviceType: K): Services[K] {
  const services = useServices();
  return services[serviceType];
}

/**
 * Convenience hooks for specific services
 */
export function useAuthService() {
  return useService('auth');
}

export function useUserService() {
  return useService('user');
}

export function useSessionService() {
  return useService('session');
}

export function useAnalysisService() {
  return useService('analysis');
}

export function useFeedbackService() {
  return useService('feedback');
}

export function useLocalStorageService() {
  return useService('localStorage');
}

export function useRemoteStorageService() {
  return useService('remoteStorage');
}

export function useNetworkService() {
  return useService('network');
}

export function useSpeechService() {
  return useService('speech');
}

export function useAudioService() {
  return useService('audio');
}
