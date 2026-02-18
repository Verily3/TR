import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = parseInt(process.env.API_PORT || '3002', 10);

async function start() {
  // Auto-migrate on startup if enabled
  if (process.env.AUTO_MIGRATE === 'true') {
    console.log('🔄 AUTO_MIGRATE enabled — running database migrations...');
    try {
      const { runMigrations } = await import('@tr/db');
      const result = await runMigrations();
      if (result.success) {
        console.log(`✅ Migrations complete (${result.durationMs}ms, ${result.newlyApplied.length} new)`);
        if (result.newlyApplied.length > 0) {
          result.newlyApplied.forEach((m) => console.log(`   + ${m}`));
        }
      } else {
        console.error(`❌ Migration failed: ${result.error}`);
        console.error('   Server will start anyway — fix manually via /admin/db/migrate');
      }
    } catch (err) {
      console.error('❌ Migration error:', err);
      console.error('   Server will start anyway — fix manually via /admin/db/migrate');
    }
  }

  console.log(`🚀 API server starting on port ${port}...`);

  const server = serve({
    fetch: app.fetch,
    port,
  });

  console.log(`✅ API server running at http://localhost:${port}`);

  // Graceful shutdown so tsx watch can restart without EADDRINUSE
  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
