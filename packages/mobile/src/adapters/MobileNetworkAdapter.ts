/**
 * Mobile Network Adapter
 * React Native implementation of the Network Service interface
 */

import {
  NetworkService,
  NetworkStatus,
  NetworkConnectionType,
} from "@speakbetter/core/services";
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from "@react-native-community/netinfo";

type NetInfoDetails = Record<string, unknown>;

/**
 * Mobile implementation of the Network Service interface
 */
export class MobileNetworkAdapter implements NetworkService {
  private listeners: Array<(isOnline: boolean) => void> = [];
  private subscription: NetInfoSubscription | null = null;
  private currentStatus: NetworkStatus = {
    isOnline: true,
    type: "unknown",
    isSlowConnection: false,
  };

  constructor() {
    // Initialize network monitoring
    this.subscription = NetInfo.addEventListener(this.handleNetworkChange);

    // Initial network check
    NetInfo.fetch().then(this.handleNetworkChange);
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState) => {
    const isOnline =
      state.isConnected === true && state.isInternetReachable !== false;
    const type = this.mapConnectionType(state.type);
    const isSlowConnection = this.isConnectionSlow(state.type, state.details);

    // Update current status
    this.currentStatus = {
      isOnline,
      type,
      isSlowConnection,
    };

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (err) {
        console.error("Error in network listener", err);
      }
    });
  };

  /**
   * Map React Native connection type to our NetworkConnectionType
   */
  private mapConnectionType(type: string): NetworkConnectionType {
    switch (type) {
      case "wifi":
        return "wifi";
      case "cellular":
        return "cellular";
      case "ethernet":
        return "ethernet";
      case "bluetooth":
      case "wimax":
        return "other";
      case "none":
        return "none";
      default:
        return "unknown";
    }
  }

  /**
   * Determine if connection is likely to be slow based on type and details
   */
  private isConnectionSlow(type: string, details: NetInfoDetails): boolean {
    if (type === "none") {
      return true;
    }

    if (type === "cellular" && details && details.cellularGeneration) {
      // 2G and 3G are considered slow
      return ["2g", "3g"].includes(
        (details.cellularGeneration as string).toLowerCase(),
      );
    }

    return false;
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Register for network state changes
   */
  onNetworkStateChanged(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback,
      );
    };
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if connection is slow
   */
  isSlowConnection(): boolean {
    return this.currentStatus.isSlowConnection;
  }

  /**
   * Check if API is reachable
   */
  async isApiReachable(apiUrl?: string): Promise<boolean> {
    if (!this.isOnline()) {
      return false;
    }

    // Default API URL - ideally this would come from configuration
    const url = apiUrl || "https://api.speakbetter.example.com/health";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch {
      // Ignore the specific error - we just return false for any error
      return false;
    }
  }

  /**
   * Wait for network connection
   */
  async waitForConnection(timeoutMs = 30000): Promise<void> {
    if (this.isOnline()) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error("Connection timeout"));
      }, timeoutMs);

      const connectionHandler = (isOnline: boolean) => {
        if (isOnline) {
          clearTimeout(timeout);
          unsubscribe();
          resolve();
        }
      };

      const unsubscribe = this.onNetworkStateChanged(connectionHandler);
    });
  }

  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 1000,
  ): Promise<T> {
    let attempt = 0;

    const execute = async (): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          throw error;
        }

        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        return execute();
      }
    };

    return execute();
  }
}
