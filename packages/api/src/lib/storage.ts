import { env } from './env.js';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Storage Provider Interface
// ---------------------------------------------------------------------------

export interface StorageProvider {
  /** Upload a file and return its storage key */
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  /** Delete a file by key */
  delete(key: string): Promise<void>;
  /** Get a public/signed URL for a key */
  getUrl(key: string): Promise<string>;
  /** Get a readable stream for proxying (local mode) */
  getStream(key: string): Promise<{ stream: ReadableStream; contentType: string } | null>;
}

// ---------------------------------------------------------------------------
// Local Filesystem Storage
// ---------------------------------------------------------------------------

class LocalStorage implements StorageProvider {
  private baseDir: string;
  private apiUrl: string;

  constructor() {
    this.baseDir = env.STORAGE_LOCAL_DIR ?? './uploads';
    this.apiUrl = `http://localhost:${env.API_PORT}`;

    // Ensure base directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, data);
    return key;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.apiUrl}/api/uploads/${key}`;
  }

  async getStream(key: string): Promise<{ stream: ReadableStream; contentType: string } | null> {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) return null;

    const ext = path.extname(key).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

    const nodeStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
    });

    return { stream: webStream, contentType };
  }
}

// ---------------------------------------------------------------------------
// S3-Compatible Storage (AWS S3, Cloudflare R2, MinIO)
// ---------------------------------------------------------------------------

class S3Storage implements StorageProvider {
  private client: import('@aws-sdk/client-s3').S3Client | null = null;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET ?? '';
  }

  private async getClient(): Promise<import('@aws-sdk/client-s3').S3Client> {
    if (this.client) return this.client;

    const { S3Client } = await import('@aws-sdk/client-s3');
    this.client = new S3Client({
      region: env.S3_REGION ?? 'us-east-1',
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
      ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
    return this.client;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );

    return key;
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async getUrl(key: string): Promise<string> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const client = await this.getClient();

    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 900 } // 15 minutes
    );
  }

  async getStream(_key: string): Promise<{ stream: ReadableStream; contentType: string } | null> {
    // In S3 mode, clients use presigned URLs directly — no proxy needed
    return null;
  }
}

// ---------------------------------------------------------------------------
// Factory + Singleton
// ---------------------------------------------------------------------------

let _storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (_storage) return _storage;

  const provider = env.STORAGE_PROVIDER ?? 'local';

  if (provider === 's3') {
    if (!env.S3_BUCKET) {
      throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');
    }
    _storage = new S3Storage();
  } else {
    _storage = new LocalStorage();
  }

  return _storage;
}

// ---------------------------------------------------------------------------
// URL Resolution Helper
// ---------------------------------------------------------------------------

/**
 * Resolve a stored avatar/image value to a URL.
 * Handles: null, storage keys, and legacy base64 data URLs.
 */
export async function resolveFileUrl(value: string | null): Promise<string | null> {
  if (!value) return null;
  // Legacy base64 data URLs — pass through during migration
  if (value.startsWith('data:')) return value;
  // Already a full URL (shouldn't happen, but safe)
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  // Storage key — resolve to URL
  return getStorage().getUrl(value);
}

// ---------------------------------------------------------------------------
// Common MIME type mapping
// ---------------------------------------------------------------------------

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
};
