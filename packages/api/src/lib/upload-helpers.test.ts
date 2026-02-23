import { describe, it, expect } from 'vitest';
import { validateFile, generateStorageKey, UploadError, UPLOAD_LIMITS } from './upload-helpers.js';

// ---------------------------------------------------------------------------
// Helper: create a fake File with given properties
// ---------------------------------------------------------------------------

function fakeFile(options: { name?: string; size?: number; type?: string }): File {
  const content = new Uint8Array(options.size ?? 100);
  return new File([content], options.name ?? 'test.png', {
    type: options.type ?? 'image/png',
  });
}

// ===========================================================================
// validateFile
// ===========================================================================

describe('validateFile', () => {
  describe('avatar category', () => {
    it('accepts a valid PNG under 5 MB', () => {
      const file = fakeFile({ name: 'photo.png', size: 1024, type: 'image/png' });
      expect(() => validateFile(file, 'avatar')).not.toThrow();
    });

    it('accepts all allowed image types', () => {
      for (const type of UPLOAD_LIMITS.avatar.types!) {
        const ext = type.split('/')[1];
        const file = fakeFile({ name: `photo.${ext}`, size: 1024, type });
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      }
    });

    it('rejects files exceeding 5 MB', () => {
      const file = fakeFile({ name: 'big.png', size: 6 * 1024 * 1024, type: 'image/png' });
      expect(() => validateFile(file, 'avatar')).toThrow(UploadError);
      expect(() => validateFile(file, 'avatar')).toThrow(/Maximum size is 5MB/);
    });

    it('rejects disallowed MIME types', () => {
      const file = fakeFile({ name: 'doc.pdf', size: 1024, type: 'application/pdf' });
      expect(() => validateFile(file, 'avatar')).toThrow(UploadError);
      expect(() => validateFile(file, 'avatar')).toThrow(/Invalid file type/);
    });

    it('rejects files with empty name', () => {
      const file = fakeFile({ name: '', size: 1024, type: 'image/png' });
      expect(() => validateFile(file, 'avatar')).toThrow(UploadError);
      expect(() => validateFile(file, 'avatar')).toThrow(/File name is required/);
    });
  });

  describe('cover category', () => {
    it('accepts valid JPEG under 5 MB', () => {
      const file = fakeFile({ name: 'cover.jpg', size: 2048, type: 'image/jpeg' });
      expect(() => validateFile(file, 'cover')).not.toThrow();
    });

    it('rejects GIF (not in cover allowed types)', () => {
      const file = fakeFile({ name: 'anim.gif', size: 1024, type: 'image/gif' });
      expect(() => validateFile(file, 'cover')).toThrow(UploadError);
    });
  });

  describe('resource category', () => {
    it('accepts any file type under 50 MB', () => {
      const file = fakeFile({
        name: 'report.pdf',
        size: 10 * 1024 * 1024,
        type: 'application/pdf',
      });
      expect(() => validateFile(file, 'resource')).not.toThrow();
    });

    it('accepts an image as a resource', () => {
      const file = fakeFile({ name: 'diagram.png', size: 1024, type: 'image/png' });
      expect(() => validateFile(file, 'resource')).not.toThrow();
    });

    it('rejects files exceeding 50 MB', () => {
      const file = fakeFile({ name: 'huge.zip', size: 51 * 1024 * 1024, type: 'application/zip' });
      expect(() => validateFile(file, 'resource')).toThrow(UploadError);
      expect(() => validateFile(file, 'resource')).toThrow(/Maximum size is 50MB/);
    });
  });

  describe('edge cases', () => {
    it('accepts a file exactly at the size limit', () => {
      const file = fakeFile({ name: 'exact.png', size: 5 * 1024 * 1024, type: 'image/png' });
      expect(() => validateFile(file, 'avatar')).not.toThrow();
    });

    it('rejects a file 1 byte over the limit', () => {
      const file = fakeFile({ name: 'over.png', size: 5 * 1024 * 1024 + 1, type: 'image/png' });
      expect(() => validateFile(file, 'avatar')).toThrow(UploadError);
    });
  });
});

// ===========================================================================
// generateStorageKey
// ===========================================================================

describe('generateStorageKey', () => {
  it('produces a key in the format category/entityId/uuid.ext', () => {
    const key = generateStorageKey('avatars', 'user-123', 'photo.png');
    expect(key).toMatch(/^avatars\/user-123\/[a-f0-9-]+\.png$/);
  });

  it('preserves the original extension in lowercase', () => {
    const key = generateStorageKey('covers', 'prog-1', 'Banner.JPEG');
    expect(key).toMatch(/\.jpeg$/);
  });

  it('uses .bin when no extension is provided', () => {
    const key = generateStorageKey('resources', 'prog-1', 'noext');
    expect(key).toMatch(/\.bin$/);
  });

  it('generates unique keys for the same inputs', () => {
    const key1 = generateStorageKey('avatars', 'user-1', 'a.png');
    const key2 = generateStorageKey('avatars', 'user-1', 'a.png');
    expect(key1).not.toBe(key2);
  });

  it('handles filenames with dots correctly', () => {
    const key = generateStorageKey('resources', 'prog-1', 'my.file.name.pdf');
    expect(key).toMatch(/\.pdf$/);
    expect(key).toMatch(/^resources\/prog-1\//);
  });
});

// ===========================================================================
// UploadError
// ===========================================================================

describe('UploadError', () => {
  it('is an instance of Error', () => {
    const err = new UploadError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name = "UploadError"', () => {
    const err = new UploadError('test');
    expect(err.name).toBe('UploadError');
  });

  it('preserves the message', () => {
    const err = new UploadError('file too large');
    expect(err.message).toBe('file too large');
  });
});

// ===========================================================================
// UPLOAD_LIMITS constants
// ===========================================================================

describe('UPLOAD_LIMITS', () => {
  it('defines avatar with 5 MB limit', () => {
    expect(UPLOAD_LIMITS.avatar.maxSize).toBe(5 * 1024 * 1024);
  });

  it('defines cover with 5 MB limit', () => {
    expect(UPLOAD_LIMITS.cover.maxSize).toBe(5 * 1024 * 1024);
  });

  it('defines resource with 50 MB limit', () => {
    expect(UPLOAD_LIMITS.resource.maxSize).toBe(50 * 1024 * 1024);
  });

  it('resource allows all types (null)', () => {
    expect(UPLOAD_LIMITS.resource.types).toBeNull();
  });

  it('avatar only allows image types', () => {
    expect(UPLOAD_LIMITS.avatar.types).toContain('image/jpeg');
    expect(UPLOAD_LIMITS.avatar.types).toContain('image/png');
    expect(UPLOAD_LIMITS.avatar.types).not.toContain('application/pdf');
  });
});
