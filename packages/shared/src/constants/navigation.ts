/**
 * Navigation items visible to each role
 * Based on Additional Program Specs requirements
 *
 * Key restrictions for Learners/Mentors/Facilitators (unless permission assigned):
 * - NO: client dashboard, scorecard, Planning & Goals (strategic), People, Analytics, Settings (admin), Program builder, Agency portal
 * - YES: programs, mentoring, assessments, notifications, help
 *
 * Note: The "dashboard" for learner/mentor/facilitator is a programs-focused view,
 * not the admin dashboard. This is handled in the routing/component level.
 */
export const NAVIGATION_BY_ROLE = {
  // Learner: Programs-focused view with personal tools (no mentoring — handled by mentor/facilitator)
  learner: [
    'dashboard',
    'programs',
    'assessments',
    'notifications',
    'help',
    'settings',
  ],

  // Mentor: Same as learner (visibility of assigned learners is handled in the programs page)
  mentor: [
    'dashboard',
    'programs',
    'mentoring',
    'assessments',
    'notifications',
    'help',
    'settings',
  ],

  // Facilitator: Similar to mentor with program management capabilities
  facilitator: [
    'dashboard',
    'programs',
    'mentoring',
    'assessments',
    'notifications',
    'help',
    'settings',
  ],

  // Tenant Admin: Full tenant access (no agency)
  tenant_admin: [
    'dashboard',
    'scorecard',
    'planning',
    'programs',
    'mentoring',
    'assessments',
    'people',
    'analytics',
    'notifications',
    'help',
    'settings',
  ],

  // Agency Admin: Full access including agency portal
  agency_admin: [
    'dashboard',
    'scorecard',
    'planning',
    'programs',
    'program-builder',
    'mentoring',
    'assessments',
    'people',
    'analytics',
    'notifications',
    'help',
    'settings',
    'agency',
  ],

  // Agency Owner: Same as Agency Admin
  agency_owner: [
    'dashboard',
    'scorecard',
    'planning',
    'programs',
    'program-builder',
    'mentoring',
    'assessments',
    'people',
    'analytics',
    'notifications',
    'help',
    'settings',
    'agency',
  ],
} as const;

export type RoleSlug = keyof typeof NAVIGATION_BY_ROLE;
export type NavigationItem = (typeof NAVIGATION_BY_ROLE)[RoleSlug][number];

/**
 * Get visible navigation items for a role
 */
export function getNavigationForRole(roleSlug: string): readonly string[] {
  return (
    NAVIGATION_BY_ROLE[roleSlug as RoleSlug] ||
    NAVIGATION_BY_ROLE.learner
  );
}

/**
 * Check if a navigation item is visible for a role
 */
export function canAccessNavItem(roleSlug: string, navItem: string): boolean {
  const items = getNavigationForRole(roleSlug);
  return items.includes(navItem as NavigationItem);
}
