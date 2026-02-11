import { PERMISSIONS, ROLE_LEVELS, type Permission } from './permissions.js';

export interface SystemRoleDefinition {
  name: string;
  slug: string;
  level: number;
  description: string;
  permissions: Permission[];
  isAgencyRole: boolean;
}

/**
 * System role definitions with their permissions
 * These are seeded into the database on first run
 */
export const SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  // Agency roles
  AGENCY_OWNER: {
    name: 'Agency Owner',
    slug: 'agency_owner',
    level: ROLE_LEVELS.AGENCY_OWNER,
    description: 'Full access to agency and all client tenants',
    isAgencyRole: true,
    permissions: Object.values(PERMISSIONS),
  },

  AGENCY_ADMIN: {
    name: 'Agency Admin',
    slug: 'agency_admin',
    level: ROLE_LEVELS.AGENCY_ADMIN,
    description: 'Manages agency operations, clients, and templates',
    isAgencyRole: true,
    permissions: [
      PERMISSIONS.AGENCY_VIEW_BILLING,
      PERMISSIONS.AGENCY_MANAGE_CLIENTS,
      PERMISSIONS.AGENCY_IMPERSONATE,
      PERMISSIONS.TEMPLATES_MANAGE,
      PERMISSIONS.TEMPLATES_VIEW,
      PERMISSIONS.TENANT_VIEW,
      PERMISSIONS.USERS_VIEW_ALL,
      PERMISSIONS.PROGRAMS_VIEW,
      PERMISSIONS.MENTORING_VIEW_ALL,
      PERMISSIONS.GOALS_VIEW,
      PERMISSIONS.ASSESSMENTS_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.HELP_VIEW,
    ],
  },

  // Tenant roles
  TENANT_ADMIN: {
    name: 'Client Admin',
    slug: 'tenant_admin',
    level: ROLE_LEVELS.TENANT_ADMIN,
    description: 'Full access to client tenant',
    isAgencyRole: false,
    permissions: [
      PERMISSIONS.TENANT_MANAGE,
      PERMISSIONS.TENANT_VIEW,
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.USERS_VIEW_ALL,
      PERMISSIONS.PROGRAMS_MANAGE,
      PERMISSIONS.PROGRAMS_CREATE,
      PERMISSIONS.PROGRAMS_VIEW,
      PERMISSIONS.PROGRAMS_ENROLL,
      PERMISSIONS.MENTORING_MANAGE,
      PERMISSIONS.MENTORING_VIEW_ALL,
      PERMISSIONS.GOALS_MANAGE,
      PERMISSIONS.GOALS_VIEW,
      PERMISSIONS.GOALS_VIEW_DIRECT_REPORTS,
      PERMISSIONS.ASSESSMENTS_MANAGE,
      PERMISSIONS.ASSESSMENTS_VIEW,
      PERMISSIONS.ASSESSMENTS_CREATE_FROM_TEMPLATE,
      PERMISSIONS.SCORECARD_MANAGE,
      PERMISSIONS.SCORECARD_VIEW,
      PERMISSIONS.PLANNING_MANAGE,
      PERMISSIONS.PLANNING_VIEW,
      PERMISSIONS.PEOPLE_MANAGE,
      PERMISSIONS.PEOPLE_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.HELP_VIEW,
    ],
  },

  FACILITATOR: {
    name: 'Facilitator',
    slug: 'facilitator',
    level: ROLE_LEVELS.FACILITATOR,
    description: 'Leads and administers programs',
    isAgencyRole: false,
    permissions: [
      PERMISSIONS.TENANT_VIEW,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.PROGRAMS_MANAGE,
      PERMISSIONS.PROGRAMS_VIEW,
      PERMISSIONS.PROGRAMS_ENROLL,
      PERMISSIONS.MENTORING_VIEW_ALL,
      PERMISSIONS.GOALS_VIEW,
      PERMISSIONS.GOALS_VIEW_DIRECT_REPORTS,
      PERMISSIONS.ASSESSMENTS_VIEW,
      PERMISSIONS.PEOPLE_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.HELP_VIEW,
    ],
  },

  MENTOR: {
    name: 'Mentor',
    slug: 'mentor',
    level: ROLE_LEVELS.MENTOR,
    description: 'Guides and supports assigned learners',
    isAgencyRole: false,
    permissions: [
      PERMISSIONS.TENANT_VIEW,
      PERMISSIONS.PROGRAMS_VIEW,
      PERMISSIONS.MENTORING_VIEW_ASSIGNED, // Key: only see assigned learners
      PERMISSIONS.GOALS_VIEW,
      PERMISSIONS.ASSESSMENTS_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.HELP_VIEW,
    ],
  },

  LEARNER: {
    name: 'Learner',
    slug: 'learner',
    level: ROLE_LEVELS.LEARNER,
    description: 'Program participant',
    isAgencyRole: false,
    permissions: [
      PERMISSIONS.TENANT_VIEW,
      PERMISSIONS.PROGRAMS_VIEW,
      PERMISSIONS.MENTORING_VIEW_ASSIGNED, // Can see their mentor
      PERMISSIONS.GOALS_VIEW,
      PERMISSIONS.ASSESSMENTS_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.HELP_VIEW,
    ],
  },
} as const;

export type SystemRoleSlug = keyof typeof SYSTEM_ROLES;

/**
 * Get role definition by slug
 */
export function getRoleBySlug(slug: string): SystemRoleDefinition | undefined {
  return Object.values(SYSTEM_ROLES).find((role) => role.slug === slug);
}

/**
 * Check if a role level has permission based on hierarchy
 */
export function hasMinimumRoleLevel(userLevel: number, requiredLevel: number): boolean {
  return userLevel >= requiredLevel;
}
