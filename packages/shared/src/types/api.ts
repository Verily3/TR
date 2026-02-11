/**
 * API request/response types for Transformation OS
 */

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Common pagination query params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Common sort query params
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Combined query params for list endpoints
 */
export interface ListQueryParams extends PaginationParams, SortParams {
  search?: string;
}

/**
 * User status enum
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * Tenant status enum
 */
export type TenantStatus = 'active' | 'trial' | 'suspended' | 'churned';

/**
 * Agency subscription tier
 */
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

/**
 * Program participant role
 */
export type ParticipantRole = 'learner' | 'mentor' | 'facilitator';

/**
 * Program status
 */
export type ProgramStatus = 'draft' | 'published' | 'archived';

/**
 * Assessment type (180 or 360)
 */
export type AssessmentType = '180' | '360';

/**
 * Rater type for assessments
 * 180: self + manager only
 * 360: self + manager + peer + direct_report
 */
export type RaterType = 'self' | 'manager' | 'peer' | 'direct_report' | 'other';
