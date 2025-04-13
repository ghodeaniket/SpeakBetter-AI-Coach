import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

type NetworkListener = (isConnected: boolean) => void;

class NetworkService {
  private static instance: NetworkService;
  private listeners: Set<NetworkListener> = new Set();
  private isConnected: boolean = true;
  private unsubscribe: NetInfoSubscription | null = null;
  
  constructor() {
    // Initialize network monitoring
    this.startMonitoring();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }
  
  /**
   * Start monitoring network connectivity
   */
  private startMonitoring(): void {
    this.unsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
    
    // Initial check
    this.checkConnectivity();
  }
  
  /**
   * Stop monitoring network connectivity
   */
  public stopMonitoring(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  /**
   * Handle connectivity change events
   */
  private handleConnectivityChange = (state: NetInfoState): void => {
    const newIsConnected = Boolean(state.isConnected);
    
    // Only notify listeners if the status has changed
    if (this.isConnected !== newIsConnected) {
      this.isConnected = newIsConnected;
      this.notifyListeners();
    }
  };
  
  /**
   * Check current connectivity status
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isConnected = Boolean(state.isConnected);
      return this.isConnected;
    } catch (error) {
      console.error('Error checking connectivity:', error);
      return false;
    }
  }
  
  /**
   * Get current connectivity status (synchronous)
   */
  public getIsConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Add a network status listener
   */
  public addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current status
    listener(this.isConnected);
    
    // Return function to remove listener
    return () => {
      this.removeListener(listener);
    };
  }
  
  /**
   * Remove a network status listener
   */
  public removeListener(listener: NetworkListener): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of network status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.isConnected);
    });
  }
  
  /**
   * Check if the device has a strong connection
   * (useful for determining if high-bandwidth operations should proceed)
   */
  public async hasStrongConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      
      // Not connected at all
      if (!state.isConnected) {
        return false;
      }
      
      // For wifi, assume it's strong enough (could be enhanced with signal strength)
      if (state.type === 'wifi') {
        return true;
      }
      
      // For cellular, check the generation
      if (state.type === 'cellular') {
        // 4G or 5G is considered strong, 3G or below is not
        if (state.details?.cellularGeneration) {
          const generation = state.details.cellularGeneration;
          return ['4g', '5g'].includes(generation);
        }
      }
      
      // Default to false for other connection types
      return false;
    } catch (error) {
      console.error('Error checking connection strength:', error);
      return false;
    }
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();
