/**
 * Storage service interface
 * 
 * This service handles all storage-related functionality,
 * including uploading, downloading, and managing files.
 */
export interface StorageService {
  /**
   * Upload a file to storage
   * @param path The path to store the file at
   * @param data The file data to upload
   * @param metadata Optional metadata for the file
   * @returns A promise that resolves to the URL of the uploaded file
   */
  uploadFile(
    path: string, 
    data: Blob | ArrayBuffer, 
    metadata?: Record<string, string>
  ): Promise<string>;
  
  /**
   * Download a file from storage
   * @param path The path of the file to download
   * @returns A promise that resolves to the file data
   */
  downloadFile(path: string): Promise<ArrayBuffer>;
  
  /**
   * Delete a file from storage
   * @param path The path of the file to delete
   * @returns A promise that resolves when the file is deleted
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * Get metadata for a file
   * @param path The path of the file to get metadata for
   * @returns A promise that resolves to the file metadata
   */
  getFileMetadata(path: string): Promise<Record<string, any>>;
  
  /**
   * Get a URL for a file
   * @param path The path of the file to get a URL for
   * @param expirationSeconds Optional expiration time in seconds
   * @returns A promise that resolves to the URL
   */
  getFileUrl(path: string, expirationSeconds?: number): Promise<string>;
}
