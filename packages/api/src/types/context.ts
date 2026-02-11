import type { Context } from 'hono';
import type { AuthUser } from '@tr/shared';
import type { schema } from '@tr/db';

type Tenant = typeof schema.tenants.$inferSelect;

/**
 * Variables available in Hono context after middleware
 */
export interface Variables {
  user: AuthUser;
  tenant?: Tenant;
}

/**
 * Authenticated context type
 */
export type AuthenticatedContext = Context<{ Variables: Variables }>;
