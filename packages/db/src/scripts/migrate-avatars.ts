/**
 * Migration script: Convert base64-encoded avatar data URLs to file storage.
 *
 * Queries all users whose `avatar` column starts with 'data:',
 * decodes the base64 payload, writes the file to the configured storage
 * directory, and updates the DB column with the storage key.
 *
 * Usage:
 *   pnpm --filter @tr/db db:migrate-avatars
 *
 * Environment:
 *   DATABASE_URL          — required
 *   STORAGE_LOCAL_DIR     — optional, defaults to ../../packages/api/uploads
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { like, eq } from 'drizzle-orm';
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import * as schema from '../schema/index.js';

const { users } = schema;

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Storage helpers (self-contained — no dependency on @tr/api)
// ---------------------------------------------------------------------------

const UPLOAD_DIR = process.env.STORAGE_LOCAL_DIR ?? path.resolve(import.meta.dirname, '../../../api/uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Parse a base64 data URL and return the decoded buffer + MIME type.
 * Supports: data:image/png;base64,iVBOR...
 */
function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string; ext: string } | null {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const extMap: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  const ext = extMap[mimeType] ?? '.bin';

  return { buffer, mimeType, ext };
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

async function migrate() {
  console.log('Migrating base64 avatars to file storage...\n');
  console.log(`Storage directory: ${UPLOAD_DIR}`);
  ensureDir(UPLOAD_DIR);

  // Find all users with base64 avatar data
  const usersWithBase64 = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, avatar: users.avatar })
    .from(users)
    .where(like(users.avatar, 'data:%'));

  if (usersWithBase64.length === 0) {
    console.log('\nNo users with base64 avatars found. Nothing to migrate.');
    await client.end();
    return;
  }

  console.log(`\nFound ${usersWithBase64.length} user(s) with base64 avatars:\n`);

  let migrated = 0;
  let skipped = 0;

  for (const user of usersWithBase64) {
    const name = `${user.firstName} ${user.lastName} (${user.email})`;

    if (!user.avatar) {
      console.log(`  SKIP ${name} — avatar is null`);
      skipped++;
      continue;
    }

    const parsed = parseDataUrl(user.avatar);
    if (!parsed) {
      console.log(`  SKIP ${name} — could not parse data URL`);
      skipped++;
      continue;
    }

    // Generate storage key: avatars/{userId}/{uuid}.{ext}
    const storageKey = `avatars/${user.id}/${randomUUID()}${parsed.ext}`;
    const filePath = path.join(UPLOAD_DIR, storageKey);

    // Write file
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, parsed.buffer);

    // Update DB
    await db
      .update(users)
      .set({ avatar: storageKey, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const sizeMb = (parsed.buffer.length / 1024).toFixed(1);
    console.log(`  OK   ${name} — ${sizeMb}KB ${parsed.mimeType} → ${storageKey}`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
