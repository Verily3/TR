import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { getStorage, resolveFileUrl } from '../lib/storage.js';
import { validateFile, generateStorageKey, UploadError } from '../lib/upload-helpers.js';
import type { Variables } from '../types/context.js';

const { users, programs } = schema;

export const uploadApiRoutes = new Hono<{ Variables: Variables }>();

// ---------------------------------------------------------------------------
// POST /api/upload/avatar — Upload user avatar
// ---------------------------------------------------------------------------
uploadApiRoutes.post('/avatar', async (c) => {
  const currentUser = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    return c.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'No file provided. Send a multipart form with a "file" field.',
        },
      },
      400
    );
  }

  try {
    validateFile(file, 'avatar');
  } catch (e) {
    if (e instanceof UploadError) {
      return c.json({ error: { code: 'BAD_REQUEST', message: e.message } }, 400);
    }
    throw e;
  }

  const storage = getStorage();
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey('avatars', currentUser.id, file.name);

  // Delete old avatar if it's a storage key (not base64)
  const [user] = await db
    .select({ avatar: users.avatar })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);
  if (user?.avatar && !user.avatar.startsWith('data:') && !user.avatar.startsWith('http')) {
    try {
      await storage.delete(user.avatar);
    } catch {
      // Ignore delete failures for old files
    }
  }

  // Upload new file
  await storage.upload(key, buffer, file.type);

  // Update DB with storage key
  await db
    .update(users)
    .set({ avatar: key, updatedAt: new Date() })
    .where(eq(users.id, currentUser.id));

  const url = await resolveFileUrl(key);
  return c.json({ data: { key, url } });
});

// ---------------------------------------------------------------------------
// DELETE /api/upload/avatar — Remove user avatar
// ---------------------------------------------------------------------------
uploadApiRoutes.delete('/avatar', async (c) => {
  const currentUser = c.get('user');

  const [user] = await db
    .select({ avatar: users.avatar })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (user?.avatar && !user.avatar.startsWith('data:') && !user.avatar.startsWith('http')) {
    try {
      await getStorage().delete(user.avatar);
    } catch {
      // Ignore delete failures
    }
  }

  await db
    .update(users)
    .set({ avatar: null, updatedAt: new Date() })
    .where(eq(users.id, currentUser.id));

  return c.json({ data: { success: true } });
});

// ---------------------------------------------------------------------------
// POST /api/upload/cover/:programId — Upload program cover image
// ---------------------------------------------------------------------------
uploadApiRoutes.post('/cover/:programId', async (c) => {
  const currentUser = c.get('user');
  const programId = c.req.param('programId')!;
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    return c.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'No file provided. Send a multipart form with a "file" field.',
        },
      },
      400
    );
  }

  try {
    validateFile(file, 'cover');
  } catch (e) {
    if (e instanceof UploadError) {
      return c.json({ error: { code: 'BAD_REQUEST', message: e.message } }, 400);
    }
    throw e;
  }

  // Verify program exists and user has access
  const [program] = await db
    .select({
      id: programs.id,
      coverImage: programs.coverImage,
      tenantId: programs.tenantId,
      agencyId: programs.agencyId,
    })
    .from(programs)
    .where(eq(programs.id, programId))
    .limit(1);

  if (!program) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Program not found' } }, 404);
  }

  // Check ownership: must belong to user's tenant or agency
  const hasAccess =
    (program.tenantId && program.tenantId === currentUser.tenantId) ||
    (program.agencyId && program.agencyId === currentUser.agencyId);

  if (!hasAccess) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'You do not have access to this program' } },
      403
    );
  }

  const storage = getStorage();
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey('covers', programId, file.name);

  // Delete old cover if it's a storage key
  if (
    program.coverImage &&
    !program.coverImage.startsWith('data:') &&
    !program.coverImage.startsWith('http')
  ) {
    try {
      await storage.delete(program.coverImage);
    } catch {
      // Ignore delete failures
    }
  }

  await storage.upload(key, buffer, file.type);
  await db
    .update(programs)
    .set({ coverImage: key, updatedAt: new Date() })
    .where(eq(programs.id, programId));

  const url = await resolveFileUrl(key);
  return c.json({ data: { key, url } });
});

// ---------------------------------------------------------------------------
// DELETE /api/upload/cover/:programId — Remove program cover image
// ---------------------------------------------------------------------------
uploadApiRoutes.delete('/cover/:programId', async (c) => {
  const currentUser = c.get('user');
  const programId = c.req.param('programId')!;

  const [program] = await db
    .select({
      id: programs.id,
      coverImage: programs.coverImage,
      tenantId: programs.tenantId,
      agencyId: programs.agencyId,
    })
    .from(programs)
    .where(eq(programs.id, programId))
    .limit(1);

  if (!program) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Program not found' } }, 404);
  }

  const hasAccess =
    (program.tenantId && program.tenantId === currentUser.tenantId) ||
    (program.agencyId && program.agencyId === currentUser.agencyId);

  if (!hasAccess) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'You do not have access to this program' } },
      403
    );
  }

  if (
    program.coverImage &&
    !program.coverImage.startsWith('data:') &&
    !program.coverImage.startsWith('http')
  ) {
    try {
      await getStorage().delete(program.coverImage);
    } catch {
      // Ignore delete failures
    }
  }

  await db
    .update(programs)
    .set({ coverImage: null, updatedAt: new Date() })
    .where(eq(programs.id, programId));

  return c.json({ data: { success: true } });
});
