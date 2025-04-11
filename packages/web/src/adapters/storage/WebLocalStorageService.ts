/**
 * Web Local Storage Service
 * Implements local storage service for web platform using IndexedDB
 */

import { 
  LocalStorageService, 
  StorageOptions,
  StorageItem
} from '@speakbetter/core/services';

import { createAppError, ErrorCategory, ErrorCodes } from '@speakbetter/core/models/error';

/**
 * IndexedDB database configuration
 */
const DB_NAME = 'speakbetter-local-storage';
const DB_VERSION = 1;
const STORE_NAME = 'items';

/**
 * Web implementation of the Local Storage Service
 * Uses IndexedDB for persistent local storage
 */
export class WebLocalStorageService implements LocalStorageService {
  private dbPromise: Promise<IDBDatabase>;
  
  constructor() {
    this.dbPromise = this.initDatabase();
  }
  
  /**
   * Initialize the IndexedDB database
   */
  private initDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        reject(createAppError(
          ErrorCodes.STORAGE_OPERATION_FAILED,
          'Failed to open local database',
          {
            category: ErrorCategory.STORAGE,
            details: `IndexedDB error: ${(event.target as any).errorCode}`,
            originalError: event
          }
        ));
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }
  
  /**
   * Get a transaction for the items store
   */
  private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBTransaction> {
    const db = await this.dbPromise;
    return db.transaction(STORE_NAME, mode);
  }
  
  /**
   * Get the object store for items
   */
  private async getObjectStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(mode);
    return transaction.objectStore(STORE_NAME);
  }
  
  /**
   * Execute a request and return a promise
   */
  private executeRequest<T>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = (event) => {
        reject(createAppError(
          ErrorCodes.STORAGE_OPERATION_FAILED,
          'IndexedDB operation failed',
          {
            category: ErrorCategory.STORAGE,
            details: `IndexedDB error: ${(event.target as any).errorCode}`,
            originalError: event
          }
        ));
      };
    });
  }
  
  /**
   * Save data to local storage
   */
  async setItem<T>(key: string, data: T, options: StorageOptions = {}): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    const item: StorageItem<T> & { key: string } = {
      key,
      data,
      storedAt: Date.now(),
      metadata: options.metadata
    };
    
    // Set expiration time if TTL is provided
    if (options.ttl) {
      item.expiresAt = Date.now() + options.ttl;
    }
    
    // TODO: Implement encryption if options.encrypt is true
    
    await this.executeRequest(store.put(item));
  }
  
  /**
   * Get data from local storage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await this.getItemWithMetadata<T>(key);
      
      if (!item) {
        return null;
      }
      
      // Check if item is expired
      if (item.expiresAt && item.expiresAt < Date.now()) {
        await this.removeItem(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Error getting item from local storage:', error);
      return null;
    }
  }
  
  /**
   * Get data with metadata from local storage
   */
  async getItemWithMetadata<T>(key: string): Promise<StorageItem<T> | null> {
    try {
      const store = await this.getObjectStore();
      const result = await this.executeRequest<StorageItem<T> & { key: string }>(store.get(key));
      
      if (!result) {
        return null;
      }
      
      // Check if item is expired
      if (result.expiresAt && result.expiresAt < Date.now()) {
        await this.removeItem(key);
        return null;
      }
      
      // TODO: Implement decryption if the item was encrypted
      
      const { key: _, ...item } = result;
      return item;
    } catch (error) {
      console.error('Error getting item with metadata from local storage:', error);
      return null;
    }
  }
  
  /**
   * Remove data from local storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      const store = await this.getObjectStore('readwrite');
      await this.executeRequest(store.delete(key));
    } catch (error) {
      console.error('Error removing item from local storage:', error);
      throw createAppError(
        ErrorCodes.STORAGE_DELETE_FAILED,
        'Failed to remove item from local storage',
        {
          category: ErrorCategory.STORAGE,
          details: `Error removing key: ${key}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Clear all data from local storage
   */
  async clear(): Promise<void> {
    try {
      const store = await this.getObjectStore('readwrite');
      await this.executeRequest(store.clear());
    } catch (error) {
      console.error('Error clearing local storage:', error);
      throw createAppError(
        ErrorCodes.STORAGE_OPERATION_FAILED,
        'Failed to clear local storage',
        {
          category: ErrorCategory.STORAGE,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Get all keys in local storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const store = await this.getObjectStore();
      const keysRequest = store.getAllKeys();
      
      return await new Promise<string[]>((resolve, reject) => {
        keysRequest.onsuccess = () => {
          resolve(keysRequest.result as string[]);
        };
        
        keysRequest.onerror = (event) => {
          reject(createAppError(
            ErrorCodes.STORAGE_OPERATION_FAILED,
            'Failed to get all keys from local storage',
            {
              category: ErrorCategory.STORAGE,
              details: `IndexedDB error: ${(event.target as any).errorCode}`,
              originalError: event
            }
          ));
        };
      });
    } catch (error) {
      console.error('Error getting all keys from local storage:', error);
      throw createAppError(
        ErrorCodes.STORAGE_OPERATION_FAILED,
        'Failed to get all keys from local storage',
        {
          category: ErrorCategory.STORAGE,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Check if an item exists in local storage
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const item = await this.getItemWithMetadata(key);
      return item !== null;
    } catch (error) {
      console.error('Error checking if item exists in local storage:', error);
      return false;
    }
  }
  
  /**
   * Check if an item is expired
   */
  async isExpired(key: string): Promise<boolean> {
    try {
      const item = await this.getItemWithMetadata(key);
      
      if (!item) {
        return true;
      }
      
      return !!(item.expiresAt && item.expiresAt < Date.now());
    } catch (error) {
      console.error('Error checking if item is expired:', error);
      return true;
    }
  }
}
