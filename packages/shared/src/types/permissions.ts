/**
 * Permission-related types for Transformation OS
 */

import type { Permission } from '../constants/permissions.js';

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  missingPermissions?: Permission[];
}

/**
 * Resource access check input
 */
export interface ResourceAccessCheck {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: 'read' | 'write' | 'delete' | 'manage';
}

/**
 * User with permissions (returned by context query)
 */
export interface UserWithPermissions {
  id: string;
  agencyId?: string;
  tenantId?: string;
  email: string;
  firstName: string;
  lastName: string;
  roleSlug: string;
  roleLevel: number;
  permissions: Permission[];
}

/**
 * Visibility scope for queries
 * Determines what data a user can see
 */
export interface VisibilityScope {
  // Full access to all data in scope
  fullAccess: boolean;

  // For mentors - list of learner IDs they can see
  assignedLearnerIds?: string[];

  // For managers - can see direct reports
  canViewDirectReports: boolean;

  // Tenant restriction
  tenantId?: string;

  // Agency restriction (for cross-tenant queries)
  agencyId?: string;
}

/**
 * Tenant settings that affect permissions
 */
export interface TenantPermissionSettings {
  // Can tenant admins create programs?
  canCreatePrograms: boolean;

  // Enabled features
  features: {
    programs: boolean;
    assessments: boolean;
    mentoring: boolean;
    goals: boolean;
    analytics: boolean;
    scorecard: boolean;
    planning: boolean;
  };
}

/**
 * Agency settings that affect tenant permissions
 */
export interface AgencyPermissionSettings {
  // Allow client admins to create programs
  allowClientProgramCreation: boolean;

  // Max number of clients
  maxClients: number;

  // Max users per client
  maxUsersPerClient: number;
}
