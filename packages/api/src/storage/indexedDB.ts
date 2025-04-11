import { 
  LocalStorageService, 
  StorageItem, 
  StorageOptions, 
  AppError 
} from '@speakbetter/core';

/**
 * Configuration for IndexedDB storage
 */
export interface IndexedDBConfig {
  /**
   * Database name
   */
  dbName: string;
  
  /**
   * Database version
   */
  dbVersion?: number;
  
  /**
   * Store name
   */
  storeName: string;
}

/**
 * IndexedDB implementation of the LocalStorageService interface
 * This provides persistent local storage for web platforms
 */
export class IndexedDBStorage implements LocalStorageService {
  private dbName: string;
  private dbVersion: number;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  
  constructor(config: IndexedDBConfig) {
    this.dbName = config.dbName;
    this.dbVersion = config.dbVersion || 1;
    this.storeName = config.storeName;
  }
  
  /**
   * Initialize the database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    
    if (this.dbPromise) {
      return this.dbPromise;
    }
    
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };
      
      request.onsuccess = (event) => {
        this.db = request.result;
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
    
    return this.dbPromise;
  }
  
  /**
   * Save data to IndexedDB
   */
  async setItem<T>(key: string, data: T, options?: StorageOptions): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const now = Date.now();
      const expiresAt = options?.ttl ? now + options.ttl : undefined;
      
      const item: StorageItem<T> & { key: string } = {
        key,
        data,
        storedAt: now,
        expiresAt,
        metadata: options?.metadata
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put(item);
        
        request.onerror = () => {
          reject(new Error(`Failed to store item in IndexedDB: ${request.error?.message}`));
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error: any) {
      const appError: AppError = {
        code: 'storage/set-item-failed',
        message: `Failed to set item in IndexedDB: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Get data from IndexedDB
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await this.getItemWithMetadata<T>(key);
      
      if (!item) {
        return null;
      }
      
      if (item.expiresAt && item.expiresAt < Date.now()) {
        await this.removeItem(key);
        return null;
      }
      
      return item.data;
    } catch (error: any) {
      const appError: AppError = {
        code: 'storage/get-item-failed',
        message: `Failed to get item from IndexedDB: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Get data with metadata from IndexedDB
   */
  async getItemWithMetadata<T>(key: string): Promise<StorageItem<T> | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onerror = () => {
          reject(new Error(`Failed to get item from IndexedDB: ${request.error?.message}`));
        };
        
        request.onsuccess = () => {
          if (!request.result) {
            resolve(null);
            return;
          }
          
          const { key: _, ...item } = request.result;
          resolve(item as StorageItem<T>);
        };
      });
    } catch (error: any) {
      const appError: AppError = {
        code: 'storage/get-item-with-metadata-failed',
        message: `Failed to get item with metadata from IndexedDB: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Remove data from IndexedDB
   */
  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        
        request.onerror = () => {
          reject(new Error(`Failed to remove item from IndexedDB: ${request.error?.message}`));
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error: any) {
      const appError: AppError = {
        code: 'storage/remove-item-failed',
        message: `Failed to remove item from IndexedDB: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Clear all data from IndexedDB
   */
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        
        request.onerror = () => {
          reject(new Error(`Failed to clear IndexedDB: ${request.error?.message}`));
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error: any) {
      const appError: AppError = {
        code: 'storage/clear-failed',
        message: `Failed to clear IndexedDB: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Get all keys in IndexedDB
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        
        request.onerror = () => {
          reject(new Error(`Failed to get all keys from IndexedDB: ${request.error?.message}`));
        };
        
        request.onsuccess = () => {
          resolve(request.result.map(key => key.toString()));
        };
      });
    } catch (error: any) {
      const appError: AppError = {
        code: 'storage/get-all-keys-failed',
        message: `Failed to get all keys from IndexedDB: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Check if an item exists in IndexedDB
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.count(key);
        
        request.onerror = () => {
          reject(new Error(`Failed to check if item exists in IndexedDB: ${request.error?.message}`));
        };
        
        request.onsuccess = () => {
          resolve(request.result > 0);
        };
      });
    } catch (error) {
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
      
      return !!item.expiresAt && item.expiresAt < Date.now();
    } catch (error) {
      return true;
    }
  }
}

/**
 * Create an IndexedDB storage instance
 */
export function createIndexedDBStorage(config: IndexedDBConfig): LocalStorageService {
  return new IndexedDBStorage(config);
}
