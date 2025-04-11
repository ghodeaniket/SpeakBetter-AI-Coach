/**
 * Network Service Interface
 * Provides network status detection and management
 */

/**
 * Network status
 */
export interface NetworkStatus {
  /**
   * Whether the device is online
   */
  isOnline: boolean;
  
  /**
   * Network connection type (if available)
   */
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'other' | 'unknown';
  
  /**
   * Effective connection type (if available)
   */
  effectiveType?: '2g' | '3g' | '4g' | 'unknown';
  
  /**
   * Whether the connection is a metered connection
   */
  isMetered?: boolean;
  
  /**
   * Whether the connection is considered slow
   */
  isSlow?: boolean;
  
  /**
   * Timestamp of the status check
   */
  timestamp: number;
}

/**
 * Network state change listener
 */
export type NetworkStateListener = (status: NetworkStatus) => void;

/**
 * Network service interface
 * Platform-agnostic interface for network operations
 */
export interface NetworkService {
  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus;
  
  /**
   * Check if device is online
   */
  isOnline(): boolean;
  
  /**
   * Check if network is considered slow
   */
  isSlowConnection(): boolean;
  
  /**
   * Subscribe to network state changes
   */
  onNetworkStateChanged(listener: NetworkStateListener): () => void;
  
  /**
   * Check if API endpoint is reachable
   */
  isApiReachable(url?: string): Promise<boolean>;
  
  /**
   * Wait for network connection
   */
  waitForConnection(timeoutMs?: number): Promise<boolean>;
  
  /**
   * Set offline mode manually
   */
  setOfflineMode(offline: boolean): void;
  
  /**
   * Check if API calls should be queued
   */
  shouldQueueRequests(): boolean;
}
