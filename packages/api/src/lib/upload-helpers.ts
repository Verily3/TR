import { randomUUID } from 'node:crypto';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Upload Limits
// ---------------------------------------------------------------------------

export const UPLOAD_LIMITS: Record<string, { maxSize: number; types: string[] | null }> = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  cover: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    types: ['image/jpeg', 'image/png', 'image/webp'],
  },
  resource: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    types: null, // all types allowed
  },
};

export type UploadCategory = 'avatar' | 'cover' | 'resource';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateFile(file: File, category: UploadCategory): void {
  const limits = UPLOAD_LIMITS[category];

  if (file.size > limits.maxSize) {
    const maxMb = Math.round(limits.maxSize / (1024 * 1024));
    throw new UploadError(`File too large. Maximum size is ${maxMb}MB.`);
  }

  if (limits.types && !limits.types.includes(file.type)) {
    throw new UploadError(`Invalid file type "${file.type}". Allowed: ${limits.types.join(', ')}`);
  }

  if (!file.name || file.name.length === 0) {
    throw new UploadError('File name is required.');
  }
}

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique storage key.
 * Format: {category}/{entityId}/{uuid}.{ext}
 */
export function generateStorageKey(
  category: string,
  entityId: string,
  originalFilename: string
): string {
  const ext = path.extname(originalFilename).toLowerCase() || '.bin';
  const uuid = randomUUID();
  return `${category}/${entityId}/${uuid}${ext}`;
}

// ---------------------------------------------------------------------------
// Upload Error
// ---------------------------------------------------------------------------

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}
