import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import { getStorage, resolveFileUrl } from '../lib/storage.js';
import { validateFile, generateStorageKey, UploadError } from '../lib/upload-helpers.js';
import type { Variables } from '../types/context.js';

const { programResources } = schema;

export const resourcesRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET / — List resources for a program
 * Optional ?lessonId= filter
 */
resourcesRoutes.get(
  '/',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const programId = c.req.param('programId')!;
    const lessonId = c.req.query('lessonId');

    const conditions = [eq(programResources.programId, programId)];
    if (lessonId) {
      conditions.push(eq(programResources.lessonId, lessonId));
    }

    const resources = await db
      .select()
      .from(programResources)
      .where(and(...conditions))
      .orderBy(asc(programResources.order), asc(programResources.createdAt));

    // Resolve URLs
    const resolved = await Promise.all(
      resources.map(async (r) => ({
        ...r,
        url: await resolveFileUrl(r.storageKey),
      }))
    );

    return c.json({ data: resolved });
  }
);

/**
 * POST / — Upload a resource file
 * Multipart form: file + name (optional) + category (optional) + lessonId (optional)
 */
resourcesRoutes.post(
  '/',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const currentUser = c.get('user');
    const programId = c.req.param('programId')!;

    const body = await c.req.parseBody();
    const file = body['file'];
    const name = typeof body['name'] === 'string' ? body['name'] : undefined;
    const category = typeof body['category'] === 'string' ? body['category'] : 'document';
    const lessonId = typeof body['lessonId'] === 'string' ? body['lessonId'] : undefined;

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
      validateFile(file, 'resource');
    } catch (e) {
      if (e instanceof UploadError) {
        return c.json({ error: { code: 'BAD_REQUEST', message: e.message } }, 400);
      }
      throw e;
    }

    const storage = getStorage();
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateStorageKey('resources', programId, file.name);

    await storage.upload(key, buffer, file.type);

    const [resource] = await db
      .insert(programResources)
      .values({
        programId,
        lessonId: lessonId || null,
        name: name || file.name,
        storageKey: key,
        mimeType: file.type,
        fileSize: file.size,
        category,
        uploadedBy: currentUser.id,
      })
      .returning();

    const url = await resolveFileUrl(key);

    return c.json({ data: { ...resource, url } }, 201);
  }
);

/**
 * POST /link — Add an external link resource (no file upload)
 */
const addLinkSchema = z.object({
  name: z.string().min(1).max(255),
  externalUrl: z.string().url(),
  category: z.string().max(50).default('link'),
  lessonId: z.string().uuid().optional(),
});

resourcesRoutes.post(
  '/link',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', addLinkSchema),
  async (c) => {
    const currentUser = c.get('user');
    const programId = c.req.param('programId')!;
    const body = c.req.valid('json');

    const [resource] = await db
      .insert(programResources)
      .values({
        programId,
        lessonId: body.lessonId || null,
        name: body.name,
        storageKey: '', // no file
        mimeType: 'text/x-url',
        fileSize: 0,
        category: body.category,
        externalUrl: body.externalUrl,
        uploadedBy: currentUser.id,
      })
      .returning();

    return c.json({ data: { ...resource, url: body.externalUrl } }, 201);
  }
);

/**
 * PUT /:resourceId — Update resource metadata
 */
const updateResourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().max(50).optional(),
  lessonId: z.string().uuid().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

resourcesRoutes.put(
  '/:resourceId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', updateResourceSchema),
  async (c) => {
    const programId = c.req.param('programId')!;
    const resourceId = c.req.param('resourceId')!;
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(programResources)
      .where(and(eq(programResources.id, resourceId), eq(programResources.programId, programId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Resource', resourceId);
    }

    const [updated] = await db
      .update(programResources)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(programResources.id, resourceId))
      .returning();

    const url = updated.externalUrl || (await resolveFileUrl(updated.storageKey));

    return c.json({ data: { ...updated, url } });
  }
);

/**
 * DELETE /:resourceId — Delete a resource
 */
resourcesRoutes.delete(
  '/:resourceId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const programId = c.req.param('programId')!;
    const resourceId = c.req.param('resourceId')!;

    const [existing] = await db
      .select()
      .from(programResources)
      .where(and(eq(programResources.id, resourceId), eq(programResources.programId, programId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Resource', resourceId);
    }

    // Delete file from storage if it has one
    if (existing.storageKey && existing.storageKey.length > 0) {
      try {
        await getStorage().delete(existing.storageKey);
      } catch {
        // Ignore storage delete failures
      }
    }

    await db.delete(programResources).where(eq(programResources.id, resourceId));

    return c.json({ data: { success: true } });
  }
);
