/**
 * Web Network Service
 * Implements network service for web platform
 */

import {
  NetworkService,
  NetworkStatus,
  NetworkStateListener
} from '@speakbetter/core/services';

/**
 * Web implementation of the Network Service
 * Uses browser APIs to detect network status
 */
export class WebNetworkService implements NetworkService {
  private listeners: Set<NetworkStateListener> = new Set();
  private manualOfflineMode: boolean = false;
  private defaultApiEndpoint: string = 'https://api.speakbetter.app/health';
  
  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);
    
    // Handle connection changes if the API is available
    if ('connection' in navigator && (navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', this.handleConnectionChange);
    }
  }
  
  /**
   * Clean up event listeners when service is destroyed
   */
  destroy() {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
    
    if ('connection' in navigator && (navigator as any).connection) {
      (navigator as any).connection.removeEventListener('change', this.handleConnectionChange);
    }
  }
  
  /**
   * Handle online/offline status changes
   */
  private handleOnlineStatusChange = () => {
    const status = this.getNetworkStatus();
    this.notifyListeners(status);
  };
  
  /**
   * Handle connection changes
   */
  private handleConnectionChange = () => {
    const status = this.getNetworkStatus();
    this.notifyListeners(status);
  };
  
  /**
   * Notify all listeners of network status change
   */
  private notifyListeners(status: NetworkStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }
  
  /**
   * Get connection properties from the NetworkInformation API
   */
  private getConnectionProperties(): {
    connectionType?: NetworkStatus['connectionType'];
    effectiveType?: NetworkStatus['effectiveType'];
    isMetered?: boolean;
  } {
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      
      let connectionType: NetworkStatus['connectionType'] = 'unknown';
      if (connection.type) {
        switch (connection.type) {
          case 'wifi':
            connectionType = 'wifi';
            break;
          case 'cellular':
            connectionType = 'cellular';
            break;
          case 'ethernet':
            connectionType = 'ethernet';
            break;
          default:
            connectionType = 'other';
        }
      }
      
      return {
        connectionType,
        effectiveType: connection.effectiveType as NetworkStatus['effectiveType'],
        isMetered: connection.saveData === true
      };
    }
    
    return {};
  }
  
  /**
   * Calculate if connection is considered slow
   */
  private calculateIsSlow(effectiveType?: NetworkStatus['effectiveType']): boolean {
    if (!effectiveType) {
      return false;
    }
    
    // Consider 2G and slow 3G connections as slow
    return effectiveType === '2g' || (effectiveType === '3g' && this.isMeteredConnection());
  }
  
  /**
   * Check if connection is metered
   */
  private isMeteredConnection(): boolean {
    if ('connection' in navigator && (navigator as any).connection) {
      return (navigator as any).connection.saveData === true;
    }
    
    return false;
  }
  
  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    // If manual offline mode is set, always return offline
    if (this.manualOfflineMode) {
      return {
        isOnline: false,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        isMetered: false,
        isSlow: false,
        timestamp: Date.now()
      };
    }
    
    const isOnline = navigator.onLine;
    const { connectionType, effectiveType, isMetered } = this.getConnectionProperties();
    const isSlow = this.calculateIsSlow(effectiveType);
    
    return {
      isOnline,
      connectionType,
      effectiveType,
      isMetered,
      isSlow,
      timestamp: Date.now()
    };
  }
  
  /**
   * Check if device is online
   */
  isOnline(): boolean {
    if (this.manualOfflineMode) {
      return false;
    }
    
    return navigator.onLine;
  }
  
  /**
   * Check if network is considered slow
   */
  isSlowConnection(): boolean {
    const { effectiveType } = this.getConnectionProperties();
    return this.calculateIsSlow(effectiveType);
  }
  
  /**
   * Subscribe to network state changes
   */
  onNetworkStateChanged(listener: NetworkStateListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify the listener of the current status
    listener(this.getNetworkStatus());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Check if API endpoint is reachable
   */
  async isApiReachable(url: string = this.defaultApiEndpoint): Promise<boolean> {
    if (this.manualOfflineMode || !this.isOnline()) {
      return false;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Wait for network connection
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    // If already online, resolve immediately
    if (this.isOnline()) {
      return true;
    }
    
    return new Promise<boolean>(resolve => {
      // Set timeout to resolve with false after specified time
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);
      
      // Create listener that resolves when online
      const unsubscribe = this.onNetworkStateChanged(status => {
        if (status.isOnline) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
  
  /**
   * Set offline mode manually
   */
  setOfflineMode(offline: boolean): void {
    const previousValue = this.manualOfflineMode;
    this.manualOfflineMode = offline;
    
    // Notify listeners if the value changed
    if (previousValue !== offline) {
      this.notifyListeners(this.getNetworkStatus());
    }
  }
  
  /**
   * Check if API calls should be queued
   */
  shouldQueueRequests(): boolean {
    // Queue requests if we're offline or in manual offline mode
    if (this.manualOfflineMode || !this.isOnline()) {
      return true;
    }
    
    // Queue requests if we're on a very slow connection
    const { effectiveType } = this.getConnectionProperties();
    return effectiveType === '2g';
  }
}
