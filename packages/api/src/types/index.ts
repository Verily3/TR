import type { Context } from "hono";

// User from Firebase token
export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

// Full user with database info
export interface CurrentUser {
  id: string;
  authProviderId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

// Tenant context
export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  agencyId: string;
  role: "admin" | "user";
}

// Agency context (for agency admins)
export interface AgencyContext {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

// Extended Hono variables
export interface AppVariables {
  // Auth user from Firebase token
  authUser: AuthUser;

  // Database user
  user: CurrentUser;

  // Current tenant (if in tenant context)
  tenant?: TenantContext;

  // Current agency (if in agency context)
  agency?: AgencyContext;

  // Request ID for tracing
  requestId: string;
}

// Typed context
export type AppContext = Context<{ Variables: AppVariables }>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination params
export interface PaginationParams {
  page: number;
  perPage: number;
}

// Common query params
export interface ListQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
