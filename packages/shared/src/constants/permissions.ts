/**
 * Permission constants for Results Tracking System
 * Format: resource:action or resource:action:scope
 */
export const PERMISSIONS = {
  // Agency-level permissions
  AGENCY_MANAGE: 'agency:manage',
  AGENCY_VIEW_BILLING: 'agency:view:billing',
  AGENCY_MANAGE_CLIENTS: 'agency:manage:clients',
  AGENCY_IMPERSONATE: 'agency:impersonate',

  // Tenant-level permissions
  TENANT_MANAGE: 'tenant:manage',
  TENANT_VIEW: 'tenant:view',

  // User management
  USERS_MANAGE: 'users:manage',
  USERS_VIEW: 'users:view',
  USERS_VIEW_ALL: 'users:view:all',

  // Programs
  PROGRAMS_MANAGE: 'programs:manage',
  PROGRAMS_CREATE: 'programs:create',
  PROGRAMS_VIEW: 'programs:view',
  PROGRAMS_ENROLL: 'programs:enroll',

  // Mentoring (renamed from Coaching)
  MENTORING_MANAGE: 'mentoring:manage',
  MENTORING_VIEW_ASSIGNED: 'mentoring:view:assigned',
  MENTORING_VIEW_ALL: 'mentoring:view:all',

  // Goals
  GOALS_MANAGE: 'goals:manage',
  GOALS_VIEW: 'goals:view',
  GOALS_VIEW_DIRECT_REPORTS: 'goals:view:direct_reports',

  // Assessments
  ASSESSMENTS_MANAGE: 'assessments:manage',
  ASSESSMENTS_VIEW: 'assessments:view',
  ASSESSMENTS_CREATE_FROM_TEMPLATE: 'assessments:create:from_template',

  // Templates (agency only)
  TEMPLATES_MANAGE: 'templates:manage',
  TEMPLATES_VIEW: 'templates:view',

  // Scorecard
  SCORECARD_MANAGE: 'scorecard:manage',
  SCORECARD_VIEW: 'scorecard:view',

  // Planning
  PLANNING_MANAGE: 'planning:manage',
  PLANNING_VIEW: 'planning:view',

  // People
  PEOPLE_MANAGE: 'people:manage',
  PEOPLE_VIEW: 'people:view',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications:view',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Help
  HELP_VIEW: 'help:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role hierarchy levels - higher number = more permissions
 */
export const ROLE_LEVELS = {
  AGENCY_OWNER: 100,
  AGENCY_ADMIN: 90,
  TENANT_ADMIN: 70,
  FACILITATOR: 50,
  MENTOR: 30,
  LEARNER: 10,
} as const;

export type RoleLevel = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];
