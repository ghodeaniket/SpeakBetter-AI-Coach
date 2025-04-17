import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../network/networkService';
import { v4 as uuidv4 } from 'uuid';
import BackgroundFetch from 'react-native-background-fetch';

// Keys for AsyncStorage
const PENDING_OPERATIONS_KEY = '@SpeakBetter:pendingOperations';
const LAST_SYNC_TIMESTAMP_KEY = '@SpeakBetter:lastSyncTimestamp';

// Operation types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

// Status types
export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Pending operation interface
export interface PendingOperation {
  id: string;
  type: OperationType;
  resource: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: SyncStatus;
  priority: number; // Higher number = higher priority
}

class SyncService {
  private static instance: SyncService;
  private isInitialized = false;
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }
  
  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Listen for network connectivity changes
    networkService.addListener(this.handleConnectivityChange);
    
    // Configure background fetch
    this.configureBackgroundFetch();
    
    this.isInitialized = true;
    
    // Try sync on initialization if we're connected
    if (networkService.getIsConnected()) {
      this.sync();
    }
  }
  
  /**
   * Configure background fetch for periodic syncing
   */
  private async configureBackgroundFetch(): Promise<void> {
    try {
      // Configure background fetch
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // Minutes
          stopOnTerminate: false,
          enableHeadless: true,
          startOnBoot: true,
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        },
        async (taskId) => {
          console.log('[BackgroundFetch] Task:', taskId);
          
          // Perform sync if online
          if (await networkService.checkConnectivity()) {
            await this.sync();
          }
          
          // Required: Signal completion of the task
          BackgroundFetch.finish(taskId);
        },
        (error) => {
          console.error('[BackgroundFetch] Failed to configure:', error);
        }
      );
      
      console.log('[BackgroundFetch] Status:', status);
    } catch (error) {
      console.error('Error configuring background fetch:', error);
    }
  }
  
  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange = (isConnected: boolean): void => {
    if (isConnected) {
      // Try to sync when we regain connectivity
      this.sync();
    }
  };
  
  /**
   * Add a pending operation for syncing
   */
  public async addPendingOperation(
    type: OperationType,
    resource: string,
    data: any,
    priority: number = 1
  ): Promise<string> {
    try {
      // Load existing pending operations
      const operations = await this.getPendingOperations();
      
      // Create new operation
      const operationId = uuidv4();
      const newOperation: PendingOperation = {
        id: operationId,
        type,
        resource,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        status: SyncStatus.PENDING,
        priority,
      };
      
      // Add to list and save
      operations.push(newOperation);
      await this.savePendingOperations(operations);
      
      // Try to sync immediately if we're online
      if (networkService.getIsConnected()) {
        this.sync();
      }
      
      return operationId;
    } catch (error) {
      console.error('Error adding pending operation:', error);
      throw error;
    }
  }
  
  /**
   * Get all pending operations
   */
  public async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const operationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
      return operationsJson ? JSON.parse(operationsJson) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }
  
  /**
   * Save pending operations
   */
  private async savePendingOperations(operations: PendingOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
      throw error;
    }
  }
  
  /**
   * Check if there are any pending operations
   */
  public async hasPendingOperations(): Promise<boolean> {
    const operations = await this.getPendingOperations();
    return operations.length > 0;
  }
  
  /**
   * Get the count of pending operations
   */
  public async getPendingOperationsCount(): Promise<number> {
    const operations = await this.getPendingOperations();
    return operations.length;
  }
  
  /**
   * Get the last sync timestamp
   */
  public async getLastSyncTimestamp(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_TIMESTAMP_KEY);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return 0;
    }
  }
  
  /**
   * Set the last sync timestamp
   */
  private async setLastSyncTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error setting last sync timestamp:', error);
    }
  }
  
  /**
   * Synchronize pending operations with the server
   */
  public async sync(): Promise<boolean> {
    // Don't sync if offline or already syncing
    if (!networkService.getIsConnected() || this.isSyncing) {
      return false;
    }
    
    this.isSyncing = true;
    this.notifyListeners(SyncStatus.SYNCING);
    
    try {
      // Get pending operations
      let operations = await this.getPendingOperations();
      
      if (operations.length === 0) {
        this.isSyncing = false;
        this.notifyListeners(SyncStatus.COMPLETED);
        return true;
      }
      
      // Sort by priority (higher first) and timestamp (older first)
      operations.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Older timestamps first
      });
      
      // Process operations in batches
      const maxBatchSize = 10;
      const batch = operations.slice(0, maxBatchSize);
      
      // Create a new array with the remaining operations
      const remainingOperations = operations.slice(maxBatchSize);
      
      // Process this batch
      for (const operation of batch) {
        try {
          // Update operation status
          operation.status = SyncStatus.SYNCING;
          
          // Here, implement the actual API calls based on the operation type
          // This would typically call your API service methods
          await this.processOperation(operation);
          
          // Mark as completed
          operation.status = SyncStatus.COMPLETED;
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error);
          
          // Increment retry count
          operation.retryCount += 1;
          
          // If retried too many times, mark as failed
          if (operation.retryCount >= 5) {
            operation.status = SyncStatus.FAILED;
          } else {
            operation.status = SyncStatus.PENDING;
          }
          
          // Add back to remaining operations
          remainingOperations.push(operation);
        }
      }
      
      // Filter out completed operations
      const updatedOperations = remainingOperations.filter(
        (op) => op.status !== SyncStatus.COMPLETED
      );
      
      // Save the updated operations
      await this.savePendingOperations(updatedOperations);
      
      // Update last sync timestamp
      await this.setLastSyncTimestamp();
      
      // If there are still pending operations, schedule another sync
      if (updatedOperations.length > 0 && networkService.getIsConnected()) {
        setTimeout(() => this.sync(), 1000); // Wait a second before continuing
      }
      
      this.isSyncing = false;
      this.notifyListeners(
        updatedOperations.length > 0 ? SyncStatus.PENDING : SyncStatus.COMPLETED
      );
      
      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      this.isSyncing = false;
      this.notifyListeners(SyncStatus.FAILED);
      return false;
    }
  }
  
  /**
   * Process a single operation (implement API calls here)
   */
  private async processOperation(operation: PendingOperation): Promise<any> {
    // This is where you would implement the actual API calls
    // based on the operation type and resource
    
    // For example:
    switch (operation.type) {
      case OperationType.CREATE:
        // Call your API service to create a resource
        // Example: return apiService.create(operation.resource, operation.data);
        console.log(`Would create ${operation.resource}:`, operation.data);
        return Promise.resolve();
        
      case OperationType.UPDATE:
        // Call your API service to update a resource
        // Example: return apiService.update(operation.resource, operation.data.id, operation.data);
        console.log(`Would update ${operation.resource}:`, operation.data);
        return Promise.resolve();
        
      case OperationType.DELETE:
        // Call your API service to delete a resource
        // Example: return apiService.delete(operation.resource, operation.data.id);
        console.log(`Would delete ${operation.resource}:`, operation.data);
        return Promise.resolve();
        
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
  
  /**
   * Add a sync status listener
   */
  public addListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.removeListener(listener);
  }
  
  /**
   * Remove a sync status listener
   */
  public removeListener(listener: (status: SyncStatus) => void): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of sync status changes
   */
  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach((listener) => {
      listener(status);
    });
  }
  
  /**
   * Get the current sync status
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    if (this.isSyncing) {
      return SyncStatus.SYNCING;
    }
    
    const hasPending = await this.hasPendingOperations();
    return hasPending ? SyncStatus.PENDING : SyncStatus.COMPLETED;
  }
  
  /**
   * Force a sync attempt
   */
  public async forceSync(): Promise<boolean> {
    return this.sync();
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
