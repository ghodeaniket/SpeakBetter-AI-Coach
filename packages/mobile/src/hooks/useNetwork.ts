import { useState, useEffect } from 'react';
import { networkService } from '../services/network/networkService';

/**
 * Custom hook to track network connectivity status
 */
export const useNetwork = () => {
  const [isConnected, setIsConnected] = useState(networkService.getIsConnected());
  const [isStrongConnection, setIsStrongConnection] = useState(false);
  
  useEffect(() => {
    // Add listener for network status changes
    const unsubscribe = networkService.addListener((connected) => {
      setIsConnected(connected);
      
      // If connected, check connection strength
      if (connected) {
        checkConnectionStrength();
      } else {
        setIsStrongConnection(false);
      }
    });
    
    // Check connection strength on mount
    checkConnectionStrength();
    
    // Clean up listener on unmount
    return unsubscribe;
  }, []);
  
  /**
   * Check if the connection is strong enough for data-intensive operations
   */
  const checkConnectionStrength = async () => {
    try {
      const isStrong = await networkService.hasStrongConnection();
      setIsStrongConnection(isStrong);
    } catch (error) {
      console.error('Error checking connection strength:', error);
      setIsStrongConnection(false);
    }
  };
  
  return {
    isConnected,
    isStrongConnection,
    checkConnectivity: async () => {
      const connected = await networkService.checkConnectivity();
      setIsConnected(connected);
      if (connected) {
        await checkConnectionStrength();
      }
      return connected;
    },
  };
};
