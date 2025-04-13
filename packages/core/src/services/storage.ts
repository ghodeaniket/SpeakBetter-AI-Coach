export interface StorageOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageService {
  uploadFile(path: string, file: Blob | File, options?: StorageOptions): Promise<string>; // Returns download URL
  getDownloadUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getMetadata(path: string): Promise<Record<string, any>>;
}