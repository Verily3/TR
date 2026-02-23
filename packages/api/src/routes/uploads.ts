import { Hono } from 'hono';
import { getStorage } from '../lib/storage.js';

/**
 * Public file-serving route for local storage mode.
 * Serves uploaded files at GET /api/uploads/{key}
 * In S3 mode, clients use presigned URLs directly and this route is unused.
 */
export const uploadsRoutes = new Hono();

// Match any nested path: /api/uploads/avatars/userId/file.jpg
uploadsRoutes.get('/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/uploads\//, '');

  if (!key || key.length === 0) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing file key' } }, 400);
  }

  // Prevent path traversal
  if (key.includes('..') || key.includes('\\')) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid file key' } }, 400);
  }

  const storage = getStorage();
  const result = await storage.getStream(key);

  if (!result) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'File not found' } }, 404);
  }

  c.header('Content-Type', result.contentType);
  c.header('Cache-Control', 'public, max-age=31536000, immutable');

  return c.body(result.stream);
});
