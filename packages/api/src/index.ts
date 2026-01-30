import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./lib/env";
import { initializeFirebase } from "./lib/firebase";

// Initialize Firebase Admin
try {
  initializeFirebase();
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error);
  process.exit(1);
}

// Start server
const port = parseInt(env.PORT, 10);

console.log(`🚀 Starting server on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✅ Server running at http://localhost:${info.port}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  }
);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});
