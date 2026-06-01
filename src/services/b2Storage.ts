// src/services/b2Storage.ts
// Backblaze B2 Cloud Storage integration
// Handles file uploads, downloads, and URL generation
// Bucket: philmediabackup (ID: 21d5f8987bbf2479adc091d)

import axios from 'axios';

interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  minimumPartSize: number;
  absoluteMinimumPartSize: number;
}

interface B2UploadUrl {
  fileId?: string;
  fileName: string;
  contentLength: number;
  contentType: string;
  contentSha1: string;
  fileInfo: Record<string, string>;
  action: string;
  bucketId: string;
  uploadUrl: string;
  authorizationToken: string;
}

interface B2FileInfo {
  fileName: string;
  fileId: string;
  downloadUrl: string;
}

class B2Storage {
  private authorizationToken: string = '';
  private apiUrl: string = '';
  private downloadUrl: string = '';
  private bucketId: string = '';
  private bucketName: string = '';
  private endpoint: string = '';
  private isAuthenticating: boolean = false;
  private authPromise: Promise<void> | null = null;

  constructor() {
    const b2BucketId = import.meta.env.VITE_B2_BUCKET_ID;
    const b2BucketName = import.meta.env.VITE_B2_BUCKET_NAME;
    const b2Endpoint = import.meta.env.VITE_B2_ENDPOINT;

    if (!b2BucketId) {
      throw new Error('Missing VITE_B2_BUCKET_ID environment variable');
    }
    if (!b2BucketName) {
      throw new Error('Missing VITE_B2_BUCKET_NAME environment variable');
    }
    if (!b2Endpoint) {
      throw new Error('Missing VITE_B2_ENDPOINT environment variable');
    }

    this.bucketId = b2BucketId;
    this.bucketName = b2BucketName;
    this.endpoint = b2Endpoint;

    console.log('B2Storage - Initialized for bucket:', this.bucketName, 'ID:', this.bucketId);
  }

  /**
   * Authenticate with Backblaze B2 API
   * This is called automatically when needed
   */
  async authenticate(): Promise<void> {
    // If already authenticating, wait for that promise
    if (this.isAuthenticating && this.authPromise) {
      return this.authPromise;
    }

    // If already authenticated and token is fresh (re-auth every hour)
    if (this.authorizationToken && this.apiUrl) {
      return;
    }

    this.isAuthenticating = true;
    this.authPromise = this._performAuthentication();

    try {
      await this.authPromise;
    } finally {
      this.isAuthenticating = false;
      this.authPromise = null;
    }
  }

  private async _performAuthentication(): Promise<void> {
    try {
      const applicationKeyId = import.meta.env.VITE_B2_APPLICATION_KEY_ID;
      const applicationKey = import.meta.env.VITE_B2_APPLICATION_KEY;

      if (!applicationKeyId || !applicationKey) {
        throw new Error('Missing B2 credentials in environment variables');
      }

      const authString = btoa(`${applicationKeyId}:${applicationKey}`);

      const response = await axios.post<B2AuthResponse>(
        'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
        {},
        {
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        }
      );

      this.authorizationToken = response.data.authorizationToken;
      this.apiUrl = response.data.apiUrl;
      this.downloadUrl = response.data.downloadUrl;

      console.log('B2Storage - Authentication successful');
    } catch (error: any) {
      console.error('B2Storage - Authentication failed:', error.message);
      throw new Error(`B2 authentication failed: ${error.message}`);
    }
  }

  /**
   * Upload a file to Backblaze B2
   * @param file The file to upload
   * @param department Department name for path organization
   * @param userId User ID for path organization
   * @returns Promise with success status and file info
   */
  async uploadFile(
    file: File,
    department: string,
    userId: string
  ): Promise<{ success: boolean; fileInfo?: B2FileInfo; error?: string }> {
    try {
      await this.authenticate();

      // Generate unique filename with timestamp
      const timestamp = new Date().getTime();
      const filename = file.name;
      const nameWithoutExt = filename.lastIndexOf('.') > 0
        ? filename.substring(0, filename.lastIndexOf('.'))
        : filename;
      const ext = filename.lastIndexOf('.') > 0
        ? filename.substring(filename.lastIndexOf('.'))
        : '';
      const uniqueFilename = `${nameWithoutExt}-${timestamp}${ext}`;

      // Construct path: department/userId/filename
      const filePath = `${department}/${userId}/${uniqueFilename}`;

      console.log('B2Storage - Getting upload URL for:', filePath);

      // Get upload URL
      const uploadUrlResponse = await axios.post<B2UploadUrl>(
        `${this.apiUrl}/b2api/v3/b2_get_upload_url`,
        { bucketId: this.bucketId },
        {
          headers: {
            'Authorization': this.authorizationToken,
          },
        }
      );

      const uploadUrl = uploadUrlResponse.data.uploadUrl;
      const uploadAuthToken = uploadUrlResponse.data.authorizationToken;

      console.log('B2Storage - Got upload URL, uploading file...');

      // Calculate SHA1 hash for integrity check
      const sha1 = await this.calculateSha1(file);

      // Upload file to B2
      const uploadResponse = await axios.post(
        uploadUrl,
        file,
        {
          headers: {
            'Authorization': uploadAuthToken,
            'X-Bz-File-Name': encodeURIComponent(filePath),
            'Content-Type': file.type || 'application/octet-stream',
            'X-Bz-Content-Sha1': sha1,
            'X-Bz-File-Legal-Hold-Status': 'none',
            'X-Bz-Server-Side-Encryption': 'none',
          },
        }
      );

      const fileId = uploadResponse.data.fileId;
      console.log('B2Storage - File uploaded successfully, fileId:', fileId);

      // Construct public download URL using B2 bucket URL
      // Format: https://f000.backblazeb2.com/file/{bucketName}/{filePath}
      const downloadUrl = `https://f000.backblazeb2.com/file/${this.bucketName}/${encodeURIComponent(filePath)}`;

      return {
        success: true,
        fileInfo: {
          fileName: filePath,
          fileId: fileId,
          downloadUrl: downloadUrl,
        },
      };
    } catch (error: any) {
      console.error('B2Storage - Upload error:', error.message);
      return {
        success: false,
        error: error.message || 'Upload to B2 failed',
      };
    }
  }

  /**
   * Calculate SHA1 hash of file
   * Required by B2 API for integrity verification
   */
  private async calculateSha1(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Delete a file from B2
   * @param fileId The file ID to delete
   * @param fileName The file name (required by B2 API)
   */
  async deleteFile(fileId: string, fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.authenticate();

      console.log('B2Storage - Deleting file:', fileId);

      await axios.post(
        `${this.apiUrl}/b2api/v3/b2_delete_file_version`,
        {
          fileId: fileId,
          fileName: fileName,
        },
        {
          headers: {
            'Authorization': this.authorizationToken,
          },
        }
      );

      console.log('B2Storage - File deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('B2Storage - Delete error:', error.message);
      return {
        success: false,
        error: error.message || 'Delete from B2 failed',
      };
    }
  }

  /**
   * Get authorization status
   */
  isAuthenticated(): boolean {
    return !!this.authorizationToken && !!this.apiUrl;
  }

  /**
   * Get bucket information
   */
  getBucketInfo(): { bucketId: string; bucketName: string; endpoint: string } {
    return {
      bucketId: this.bucketId,
      bucketName: this.bucketName,
      endpoint: this.endpoint,
    };
  }
}

// Export singleton instance
export const b2Storage = new B2Storage();
