import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = parseInt(process.env.API_PORT || '3002', 10);

console.log(`🚀 API server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ API server running at http://localhost:${port}`);
