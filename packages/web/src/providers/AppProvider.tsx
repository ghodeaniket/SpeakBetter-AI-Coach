/**
 * App Provider Component
 * Combines all providers for the application
 */

import React, { ReactNode } from 'react';
import { ServiceProvider } from './ServiceProvider';

/**
 * Props for AppProvider component
 */
interface AppProviderProps {
  /**
   * Children to render inside the provider
   */
  children: ReactNode;
}

/**
 * App Provider Component
 * Wraps the application with all required providers
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ServiceProvider>
      {/* Add more providers here as needed */}
      {children}
    </ServiceProvider>
  );
};
