/**
 * Storage Service Interface
 * Provides data storage functionality for both remote and local storage
 */

/**
 * Storage options for saving data
 */
export interface StorageOptions {
  /**
   * Time-to-live in milliseconds (for caching)
   */
  ttl?: number;
  
  /**
   * Whether to encrypt the data
   */
  encrypt?: boolean;
  
  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Storage item with metadata
 */
export interface StorageItem<T> {
  /**
   * The stored data
   */
  data: T;
  
  /**
   * When the item was stored
   */
  storedAt: number;
  
  /**
   * When the item expires (if applicable)
   */
  expiresAt?: number;
  
  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Local storage service interface
 * Platform-agnostic interface for local storage operations
 */
export interface LocalStorageService {
  /**
   * Save data to local storage
   */
  setItem<T>(key: string, data: T, options?: StorageOptions): Promise<void>;
  
  /**
   * Get data from local storage
   */
  getItem<T>(key: string): Promise<T | null>;
  
  /**
   * Get data with metadata from local storage
   */
  getItemWithMetadata<T>(key: string): Promise<StorageItem<T> | null>;
  
  /**
   * Remove data from local storage
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Clear all data from local storage
   */
  clear(): Promise<void>;
  
  /**
   * Get all keys in local storage
   */
  getAllKeys(): Promise<string[]>;
  
  /**
   * Check if an item exists in local storage
   */
  hasItem(key: string): Promise<boolean>;
  
  /**
   * Check if an item is expired
   */
  isExpired(key: string): Promise<boolean>;
}

/**
 * File storage options
 */
export interface FileStorageOptions {
  /**
   * Content type of the file
   */
  contentType?: string;
  
  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Progress callback
   */
  onProgress?: (progress: number) => void;
}

/**
 * Remote file storage service interface
 * Platform-agnostic interface for remote file storage operations
 */
export interface RemoteStorageService {
  /**
   * Upload a file
   */
  uploadFile(
    path: string, 
    file: Blob | ArrayBuffer | File, 
    options?: FileStorageOptions
  ): Promise<string>;
  
  /**
   * Download a file
   */
  downloadFile(path: string): Promise<Blob>;
  
  /**
   * Get download URL for a file
   */
  getDownloadUrl(path: string): Promise<string>;
  
  /**
   * Delete a file
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * List files in a directory
   */
  listFiles(directory: string): Promise<string[]>;
  
  /**
   * Get file metadata
   */
  getFileMetadata(path: string): Promise<Record<string, any>>;
  
  /**
   * Update file metadata
   */
  updateFileMetadata(path: string, metadata: Record<string, any>): Promise<void>;
}
