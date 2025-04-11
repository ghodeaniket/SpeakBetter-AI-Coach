/**
 * Web Remote Storage Service
 * Implements remote storage service for web platform using Firebase Storage
 */

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  getMetadata,
  updateMetadata,
  deleteObject
} from 'firebase/storage';
import { initializeApp } from 'firebase/app';

import {
  RemoteStorageService,
  FileStorageOptions,
  AuthService
} from '@speakbetter/core/services';
import {
  createAppError,
  ErrorCategory,
  ErrorCodes
} from '@speakbetter/core/models/error';

/**
 * Web implementation of the Remote Storage Service
 * Uses Firebase Storage for cloud storage
 */
export class WebRemoteStorageService implements RemoteStorageService {
  private storage;
  private authService: AuthService;
  
  constructor(authService: AuthService) {
    this.authService = authService;
    
    // Get the Firebase app instance from the auth service
    // In a real implementation, we would handle this better
    const app = (this.authService as any).app;
    this.storage = getStorage(app);
  }
  
  /**
   * Upload a file to remote storage
   */
  async uploadFile(
    path: string,
    file: Blob | ArrayBuffer | File,
    options: FileStorageOptions = {}
  ): Promise<string> {
    try {
      // Create a storage reference
      const storageRef = ref(this.storage, path);
      
      // Convert ArrayBuffer to Blob if needed
      const fileData = file instanceof ArrayBuffer ? new Blob([file]) : file;
      
      // Set up metadata
      const metadata: any = {
        contentType: options.contentType || this.getContentTypeFromFile(fileData),
        customMetadata: options.metadata || {}
      };
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, fileData, metadata);
      
      // Set up progress listener if provided
      if (options.onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options.onProgress?.(progress);
        });
      }
      
      // Wait for upload to complete
      await uploadTask;
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw createAppError(
        ErrorCodes.STORAGE_UPLOAD_FAILED,
        'Failed to upload file to remote storage',
        {
          category: ErrorCategory.STORAGE,
          details: `Error uploading to path: ${path}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Download a file from remote storage
   */
  async downloadFile(path: string): Promise<Blob> {
    try {
      // Get the download URL
      const downloadUrl = await this.getDownloadUrl(path);
      
      // Fetch the file
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw createAppError(
        ErrorCodes.STORAGE_DOWNLOAD_FAILED,
        'Failed to download file from remote storage',
        {
          category: ErrorCategory.STORAGE,
          details: `Error downloading from path: ${path}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Get download URL for a file
   */
  async getDownloadUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw createAppError(
        ErrorCodes.STORAGE_NOT_FOUND,
        'Failed to get download URL for file',
        {
          category: ErrorCategory.STORAGE,
          details: `Error getting URL for path: ${path}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Delete a file from remote storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw createAppError(
        ErrorCodes.STORAGE_DELETE_FAILED,
        'Failed to delete file from remote storage',
        {
          category: ErrorCategory.STORAGE,
          details: `Error deleting file at path: ${path}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * List files in a directory
   */
  async listFiles(directory: string): Promise<string[]> {
    try {
      const directoryRef = ref(this.storage, directory);
      const listResult = await listAll(directoryRef);
      
      // Return just the file paths
      return listResult.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Error listing files:', error);
      throw createAppError(
        ErrorCodes.STORAGE_OPERATION_FAILED,
        'Failed to list files in directory',
        {
          category: ErrorCategory.STORAGE,
          details: `Error listing files in directory: ${directory}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Get file metadata
   */
  async getFileMetadata(path: string): Promise<Record<string, any>> {
    try {
      const storageRef = ref(this.storage, path);
      const metadata = await getMetadata(storageRef);
      
      // Combine standard metadata with custom metadata
      return {
        contentType: metadata.contentType,
        size: metadata.size,
        createdAt: metadata.timeCreated,
        updatedAt: metadata.updated,
        ...metadata.customMetadata
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw createAppError(
        ErrorCodes.STORAGE_OPERATION_FAILED,
        'Failed to get file metadata',
        {
          category: ErrorCategory.STORAGE,
          details: `Error getting metadata for file at path: ${path}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Update file metadata
   */
  async updateFileMetadata(path: string, metadata: Record<string, any>): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      
      // Prepare metadata object for Firebase
      const metadataObj = {
        customMetadata: metadata
      };
      
      await updateMetadata(storageRef, metadataObj);
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw createAppError(
        ErrorCodes.STORAGE_OPERATION_FAILED,
        'Failed to update file metadata',
        {
          category: ErrorCategory.STORAGE,
          details: `Error updating metadata for file at path: ${path}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Helper method to determine content type from a file
   */
  private getContentTypeFromFile(file: Blob | File): string {
    if (file instanceof File) {
      return file.type || 'application/octet-stream';
    }
    
    return file.type || 'application/octet-stream';
  }
}
