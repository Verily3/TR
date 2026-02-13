import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, closeDatabase } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
  console.log('Migrations completed successfully.');
  await closeDatabase();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
