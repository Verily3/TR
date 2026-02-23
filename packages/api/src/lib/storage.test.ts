import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Set STORAGE_LOCAL_DIR to a temp directory BEFORE importing storage module
const tmpDir = path.join(os.tmpdir(), `storage-test-${Date.now()}`);
process.env.STORAGE_LOCAL_DIR = tmpDir;

const { resolveFileUrl, getStorage } = await import('./storage.js');

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(() => {
  // getStorage() creates the directory on first call
  getStorage();
});

afterAll(() => {
  // Clean up temp directory
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ===========================================================================
// resolveFileUrl
// ===========================================================================

describe('resolveFileUrl', () => {
  it('returns null for null input', async () => {
    expect(await resolveFileUrl(null)).toBeNull();
  });

  it('returns null for empty string', async () => {
    expect(await resolveFileUrl('')).toBeNull();
  });

  it('passes through base64 data URLs unchanged', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
    expect(await resolveFileUrl(dataUrl)).toBe(dataUrl);
  });

  it('passes through http URLs unchanged', async () => {
    const url = 'http://example.com/image.png';
    expect(await resolveFileUrl(url)).toBe(url);
  });

  it('passes through https URLs unchanged', async () => {
    const url = 'https://cdn.example.com/image.png';
    expect(await resolveFileUrl(url)).toBe(url);
  });

  it('resolves a storage key to a local API URL', async () => {
    const url = await resolveFileUrl('avatars/user-1/abc.png');
    expect(url).toContain('/api/uploads/avatars/user-1/abc.png');
    expect(url).toMatch(/^http:\/\/localhost:\d+/);
  });
});

// ===========================================================================
// LocalStorage — upload, getUrl, delete, getStream
// ===========================================================================

describe('LocalStorage', () => {
  const storage = getStorage();

  describe('upload', () => {
    it('writes a file and returns the key', async () => {
      const key = 'test-dir/file1.txt';
      const data = Buffer.from('hello world');
      const result = await storage.upload(key, data, 'text/plain');

      expect(result).toBe(key);
      const filePath = path.join(tmpDir, key);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world');
    });

    it('creates nested directories as needed', async () => {
      const key = 'deep/nested/dir/file.txt';
      const data = Buffer.from('nested content');
      await storage.upload(key, data, 'text/plain');

      const filePath = path.join(tmpDir, key);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('overwrites an existing file', async () => {
      const key = 'overwrite/file.txt';
      await storage.upload(key, Buffer.from('v1'), 'text/plain');
      await storage.upload(key, Buffer.from('v2'), 'text/plain');

      const filePath = path.join(tmpDir, key);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('v2');
    });
  });

  describe('getUrl', () => {
    it('returns a local API URL for a key', async () => {
      const url = await storage.getUrl('avatars/user-1/photo.png');
      expect(url).toMatch(/^http:\/\/localhost:\d+\/api\/uploads\/avatars\/user-1\/photo\.png$/);
    });
  });

  describe('delete', () => {
    it('removes an existing file', async () => {
      const key = 'delete-test/file.txt';
      await storage.upload(key, Buffer.from('temp'), 'text/plain');

      const filePath = path.join(tmpDir, key);
      expect(fs.existsSync(filePath)).toBe(true);

      await storage.delete(key);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('does not throw when deleting a non-existent file', async () => {
      await expect(storage.delete('nonexistent/file.txt')).resolves.not.toThrow();
    });
  });

  describe('getStream', () => {
    it('returns null for a non-existent file', async () => {
      const result = await storage.getStream('does-not-exist.txt');
      expect(result).toBeNull();
    });

    it('returns a ReadableStream with correct contentType for .png', async () => {
      const key = 'stream-test/image.png';
      await storage.upload(key, Buffer.from('png-data'), 'image/png');

      const result = await storage.getStream(key);
      expect(result).not.toBeNull();
      expect(result!.contentType).toBe('image/png');
      expect(result!.stream).toBeInstanceOf(ReadableStream);
    });

    it('returns application/octet-stream for unknown extensions', async () => {
      const key = 'stream-test/file.xyz';
      await storage.upload(key, Buffer.from('data'), 'application/octet-stream');

      const result = await storage.getStream(key);
      expect(result).not.toBeNull();
      expect(result!.contentType).toBe('application/octet-stream');
    });

    it('maps common extensions to correct MIME types', async () => {
      const cases: [string, string][] = [
        ['test.jpg', 'image/jpeg'],
        ['test.jpeg', 'image/jpeg'],
        ['test.pdf', 'application/pdf'],
        ['test.gif', 'image/gif'],
        ['test.webp', 'image/webp'],
        ['test.csv', 'text/csv'],
        ['test.json', 'application/json'],
      ];

      for (const [filename, expectedMime] of cases) {
        const key = `mime-test/${filename}`;
        await storage.upload(key, Buffer.from('x'), expectedMime);
        const result = await storage.getStream(key);
        expect(result!.contentType).toBe(expectedMime);
      }
    });
  });
});
