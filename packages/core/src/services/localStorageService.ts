/**
 * Interface for storage item used in local storage
 */
export interface StorageItem {
  key: string;
  value: unknown;
  timestamp: number;
  expires?: number;
}

/**
 * Options for storage operations
 */
export interface StorageOptions {
  /** 
   * Time to live in milliseconds
   */
  ttl?: number;
  
  /**
   * Storage namespace/category
   */
  namespace?: string;
}

/**
 * Local storage service for client-side storage
 */
export interface LocalStorageService {
  /**
   * Set a value in storage
   * @param key Key to store under
   * @param value Value to store
   * @param options Storage options
   */
  setItem<T>(key: string, value: T, options?: StorageOptions): Promise<void>;
  
  /**
   * Get a value from storage
   * @param key Key to retrieve
   * @returns The stored value or null if not found
   */
  getItem<T>(key: string): Promise<T | null>;
  
  /**
   * Remove an item from storage
   * @param key Key to remove
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Clear all items from storage
   */
  clear(): Promise<void>;
  
  /**
   * Get all keys in storage
   */
  keys(): Promise<string[]>;
}
