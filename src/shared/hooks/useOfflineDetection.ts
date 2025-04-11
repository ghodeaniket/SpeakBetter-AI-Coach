import { useState, useEffect } from 'react';

/**
 * A hook for detecting the online/offline status of the application.
 * @returns An object containing the online status and helper methods
 */
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check immediately to get the current status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Check if the network is currently available
   * Can be used before performing network operations
   */
  const checkNetworkStatus = (): boolean => {
    return navigator.onLine;
  };

  return {
    isOnline,
    isOffline: !isOnline,
    checkNetworkStatus,
  };
};

export default useOfflineDetection;
