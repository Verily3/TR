// ============================================================================
// DATABASE PACKAGE - Main entry point
// ============================================================================

// Export database client
export { db } from "./client";

// Export all schema definitions
export * from "./schema";

// Re-export drizzle-orm utilities for convenience
export { eq, ne, gt, gte, lt, lte, and, or, not, inArray, notInArray, isNull, isNotNull, sql } from "drizzle-orm";
