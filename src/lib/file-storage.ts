export interface FileStorageAdapter {
  generateDownloadUrl(gameId: string, fileName: string, expiresInHours?: number): Promise<string>;
  uploadFile?(gameId: string, fileName: string, fileBuffer: Buffer): Promise<string>;
  isConfigured(): boolean;
  getServiceName(): string;
}

export type S3ProviderName = 'aws' | 'r2' | 'backblaze' | 'custom';

class GenericS3Adapter implements FileStorageAdapter {
  private accessKeyId: string;
  private secretAccessKey: string;
  private bucketName: string;
  private region: string;
  private endpoint: string;
  private forcePathStyle: boolean;
  private providerName: S3ProviderName;

  constructor() {
    this.providerName = (import.meta.env.S3_PROVIDER || 'aws').toLowerCase() as S3ProviderName;
    this.accessKeyId = import.meta.env.S3_ACCESS_KEY_ID || '';
    this.secretAccessKey = import.meta.env.S3_SECRET_ACCESS_KEY || '';
    this.bucketName = import.meta.env.S3_BUCKET_NAME || '';
    this.region = import.meta.env.S3_REGION || 'auto';
    this.forcePathStyle = (import.meta.env.S3_FORCE_PATH_STYLE === 'true');

    switch (this.providerName) {
      case 'r2':
        this.endpoint = import.meta.env.S3_ENDPOINT || `https://${import.meta.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        // R2 typically needs forcePathStyle true
        this.forcePathStyle = true;
        break;
      case 'backblaze':
        this.endpoint = import.meta.env.S3_ENDPOINT || 'https://s3.us-west-002.backblazeb2.com';
        break;
      case 'custom':
        this.endpoint = import.meta.env.S3_ENDPOINT || '';
        break;
      case 'aws':
      default:
        this.endpoint = import.meta.env.S3_ENDPOINT || ''; // AWS SDK uses default if empty
        break;
    }
  }

  isConfigured(): boolean {
    const configured = !!(this.accessKeyId && this.secretAccessKey && this.bucketName);
    if (configured) {
      console.log(`🔧 [S3] Using provider: ${this.providerName}`);
      console.log(`🔧 [S3] Access Key ID: ${this.accessKeyId.substring(0, 8)}...`);
      console.log(`🔧 [S3] Bucket Name: ${this.bucketName}`);
      console.log(`🔧 [S3] Region: ${this.region}`);
      console.log(`🔧 [S3] Endpoint: ${this.endpoint || '(default AWS endpoint)'}`);
      console.log(`🔧 [S3] Force Path Style: ${this.forcePathStyle}`);
    }
    return configured;
  }

  getServiceName(): string {
    return `S3 (${this.providerName})`;
  }

  async generateDownloadUrl(gameId: string, fileName: string, expiresInHours = 48): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3-compatible storage not configured');
    }
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const s3Client = new S3Client({
        region: this.region,
        endpoint: this.endpoint || undefined,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
        forcePathStyle: this.forcePathStyle,
      });

      const objectKey = `${gameId}/${fileName}`;
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInHours * 3600,
      });

      console.log(`Generated signed URL for ${objectKey}, expires in ${expiresInHours}h`);
      return signedUrl;

    } catch (error) {
      console.error('Failed to generate signed URL:', error);

      const token = this.generateSecureToken(gameId, fileName, expiresInHours);
      const baseUrl = import.meta.env.DEV ? 'http://localhost:4321' : import.meta.env.SITE_URL || '';

      console.log('Falling back to internal download endpoint');
      return `${baseUrl}/api/download?gameId=${gameId}&token=${token}`;
    }
  }

  private generateSecureToken(gameId: string, fileName: string, expiresInHours: number): string {
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

    const token = this.generateSecureToken(gameId, fileName, expiresInHours);
    const baseUrl = import.meta.env.DEV ? 'http://localhost:4321' : import.meta.env.SITE_URL || '';

    return `${baseUrl}/api/download?gameId=${gameId}&token=${token}`;
  }

  private generateSecureToken(gameId: string, fileName: string, expiresInHours: number): string {
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

export type FileStorageProvider = 's3' | 'bunny-net' | 'local';

export function getFileStorageProvider(): FileStorageProvider {
  const provider = (import.meta.env.FILE_STORAGE_PROVIDER || '').toLowerCase();
  switch (provider) {
    case 's3':
      return 's3';
    case 'bunny-net':
    case 'bunny':
      return 'bunny-net';
    case 'local':
      return 'local';
    default:
      const s3 = new GenericS3Adapter();
      const bunny = new BunnyNetAdapter();
      if (s3.isConfigured()) return 's3';
      if (bunny.isConfigured()) return 'bunny-net';
      return 'local';
  }
}

export function getFileStorageAdapter(): FileStorageAdapter {
  const provider = getFileStorageProvider();
  switch (provider) {
    case 's3':
      return new GenericS3Adapter();
    case 'bunny-net':
      return new BunnyNetAdapter();
    case 'local':
      return new LocalFileAdapter();
    default:
      throw new Error(`Unknown file storage provider: ${provider}`);
  }
}
