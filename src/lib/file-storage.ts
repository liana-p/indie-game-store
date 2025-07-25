// File storage abstraction for game downloads

export interface FileStorageAdapter {
  // Generate a secure, time-limited download URL
  generateDownloadUrl(gameId: string, fileName: string, expiresInHours?: number): Promise<string>;
  
  // Upload a file (for future admin interface)
  uploadFile?(gameId: string, fileName: string, fileBuffer: Buffer): Promise<string>;
  
  // Check if the service is properly configured
  isConfigured(): boolean;
  
  // Get service name for logging
  getServiceName(): string;
}

export interface DownloadUrlOptions {
  expiresInHours?: number;
  maxDownloads?: number;
  customToken?: string;
}

// Cloudflare R2 implementation
class CloudflareR2Adapter implements FileStorageAdapter {
  private accessKeyId: string;
  private secretAccessKey: string;
  private bucketName: string;
  private accountId: string;
  private region: string;
  private customDomain?: string;

  constructor() {
    this.accessKeyId = import.meta.env.R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY || '';
    this.bucketName = import.meta.env.R2_BUCKET_NAME || '';
    this.accountId = import.meta.env.R2_ACCOUNT_ID || '';
    this.region = import.meta.env.R2_REGION || 'auto';
    this.customDomain = import.meta.env.R2_CUSTOM_DOMAIN;
  }

  isConfigured(): boolean {
    const configured = !!(this.accessKeyId && this.secretAccessKey && this.bucketName && this.accountId);
    if (configured) {
      console.log('🔧 [R2] Configuration check:');
      console.log('🔧 [R2] Access Key ID:', this.accessKeyId ? `${this.accessKeyId.substring(0, 8)}...` : 'NOT SET');
      console.log('🔧 [R2] Secret Key:', this.secretAccessKey ? `${this.secretAccessKey.substring(0, 8)}...` : 'NOT SET');
      console.log('🔧 [R2] Bucket Name:', this.bucketName);
      console.log('🔧 [R2] Account ID:', this.accountId);
      console.log('🔧 [R2] Region:', this.region);
      console.log('🔧 [R2] Endpoint:', `https://${this.accountId}.r2.cloudflarestorage.com`);
    }
    return configured;
  }

  getServiceName(): string {
    return 'Cloudflare R2';
  }

  async generateDownloadUrl(gameId: string, fileName: string, expiresInHours = 48): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 not configured');
    }

    try {
      // Import AWS SDK dynamically to avoid bundling issues
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      // Create S3 client configured for Cloudflare R2
      const s3Client = new S3Client({
        region: 'us-east-1', // R2 works better with a specific region instead of 'auto'
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
        // R2-specific configuration
        forcePathStyle: true,
      });
      
      console.log('🔧 [R2] S3 Client configured with:');
      console.log('🔧 [R2] Region: us-east-1');
      console.log('🔧 [R2] Endpoint:', `https://${this.accountId}.r2.cloudflarestorage.com`);
      console.log('🔧 [R2] Force Path Style: true');

      // Generate signed URL for the file
      const objectKey = `${gameId}/${fileName}`;
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInHours * 60 * 60, // Convert hours to seconds
      });

      console.log(`Generated R2 signed URL for ${objectKey}, expires in ${expiresInHours}h`);
      return signedUrl;

    } catch (error) {
      console.error('Failed to generate R2 signed URL:', error);
      
      // Fallback to our own download endpoint
      const token = this.generateSecureToken(gameId, fileName, expiresInHours);
      const baseUrl = import.meta.env.DEV ? 'http://localhost:4321' : import.meta.env.SITE_URL || '';
      
      console.log('Falling back to internal download endpoint');
      return `${baseUrl}/api/download?gameId=${gameId}&token=${token}`;
    }
  }

  private generateSecureToken(gameId: string, fileName: string, expiresInHours: number): string {
    // Simple token generation for fallback
    const expiry = Date.now() + (expiresInHours * 60 * 60 * 1000);
    const payload = `${gameId}:${fileName}:${expiry}`;
    return Buffer.from(payload).toString('base64url');
  }
}

// Bunny.net CDN implementation
class BunnyNetAdapter implements FileStorageAdapter {
  private apiKey: string;
  private storageZone: string;
  private cdnUrl: string;

  constructor() {
    this.apiKey = import.meta.env.BUNNY_API_KEY || '';
    this.storageZone = import.meta.env.BUNNY_STORAGE_ZONE || '';
    this.cdnUrl = import.meta.env.BUNNY_CDN_URL || '';
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.storageZone && this.cdnUrl);
  }

  getServiceName(): string {
    return 'Bunny.net CDN';
  }

  async generateDownloadUrl(gameId: string, fileName: string, expiresInHours = 48): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Bunny.net not configured');
    }

    // Generate signed URL for Bunny.net
    const expiry = Math.floor(Date.now() / 1000) + (expiresInHours * 60 * 60);
    const filePath = `${gameId}/${fileName}`;
    
    // For now, return a placeholder URL that points to our download endpoint
    // In a full implementation, this would generate a signed Bunny.net URL
    const token = this.generateSecureToken(gameId, fileName, expiresInHours);
    const baseUrl = import.meta.env.DEV ? 'http://localhost:4321' : import.meta.env.SITE_URL || '';
    
    return `${baseUrl}/api/download?gameId=${gameId}&token=${token}`;
  }

  private generateSecureToken(gameId: string, fileName: string, expiresInHours: number): string {
    // Simple token generation - in production, use proper JWT or similar
    const expiry = Date.now() + (expiresInHours * 60 * 60 * 1000);
    const payload = `${gameId}:${fileName}:${expiry}`;
    return Buffer.from(payload).toString('base64url');
  }
}

// Local file system adapter (for development)
class LocalFileAdapter implements FileStorageAdapter {
  isConfigured(): boolean {
    return true;
  }

  getServiceName(): string {
    return 'Local File System (Development)';
  }

  async generateDownloadUrl(gameId: string, fileName: string, expiresInHours = 48): Promise<string> {
    const token = this.generateSecureToken(gameId, fileName, expiresInHours);
    return `http://localhost:4321/api/download?gameId=${gameId}&token=${token}`;
  }

  private generateSecureToken(gameId: string, fileName: string, expiresInHours: number): string {
    const expiry = Date.now() + (expiresInHours * 60 * 60 * 1000);
    const payload = `${gameId}:${fileName}:${expiry}`;
    return Buffer.from(payload).toString('base64url');
  }
}

// File storage configuration
export type FileStorageProvider = 'cloudflare-r2' | 'bunny-net' | 'local';

export function getFileStorageProvider(): FileStorageProvider {
  const provider = import.meta.env.FILE_STORAGE_PROVIDER?.toLowerCase();
  
  switch (provider) {
    case 'cloudflare-r2':
    case 'r2':
      return 'cloudflare-r2';
    case 'bunny-net':
    case 'bunny':
      return 'bunny-net';
    case 'local':
      return 'local';
    default:
      // Auto-detect based on available configuration
      const r2Adapter = new CloudflareR2Adapter();
      const bunnyAdapter = new BunnyNetAdapter();
      
      if (r2Adapter.isConfigured()) {
        return 'cloudflare-r2';
      } else if (bunnyAdapter.isConfigured()) {
        return 'bunny-net';
      } else {
        return 'local';
      }
  }
}

// Storage adapter factory
export function getFileStorageAdapter(): FileStorageAdapter {
  const provider = getFileStorageProvider();
  
  switch (provider) {
    case 'cloudflare-r2':
      return new CloudflareR2Adapter();
    case 'bunny-net':
      return new BunnyNetAdapter();
    case 'local':
      return new LocalFileAdapter();
    default:
      throw new Error(`Unknown file storage provider: ${provider}`);
  }
}

// Utility to validate and parse download tokens
export function parseDownloadToken(token: string): { gameId: string; fileName: string; expiry: number } | null {
  try {
    const payload = Buffer.from(token, 'base64url').toString();
    const [gameId, fileName, expiryStr] = payload.split(':');
    const expiry = parseInt(expiryStr, 10);
    
    if (!gameId || !fileName || !expiry || isNaN(expiry)) {
      return null;
    }
    
    return { gameId, fileName, expiry };
  } catch {
    return null;
  }
}