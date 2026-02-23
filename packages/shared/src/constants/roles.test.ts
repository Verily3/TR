import { describe, it, expect } from 'vitest';
import { SYSTEM_ROLES, getRoleBySlug, hasMinimumRoleLevel } from './roles.js';
import { PERMISSIONS, ROLE_LEVELS } from './permissions.js';

describe('SYSTEM_ROLES', () => {
  it('agency_owner has all permissions', () => {
    const allPermissions = Object.values(PERMISSIONS);
    expect(SYSTEM_ROLES.AGENCY_OWNER.permissions).toEqual(allPermissions);
  });

  it('each role has a unique level', () => {
    const levels = Object.values(SYSTEM_ROLES).map((r) => r.level);
    const unique = new Set(levels);
    expect(unique.size).toBe(levels.length);
  });

  it('agency roles have isAgencyRole = true', () => {
    expect(SYSTEM_ROLES.AGENCY_OWNER.isAgencyRole).toBe(true);
    expect(SYSTEM_ROLES.AGENCY_ADMIN.isAgencyRole).toBe(true);
  });

  it('tenant roles have isAgencyRole = false', () => {
    expect(SYSTEM_ROLES.TENANT_ADMIN.isAgencyRole).toBe(false);
    expect(SYSTEM_ROLES.FACILITATOR.isAgencyRole).toBe(false);
    expect(SYSTEM_ROLES.MENTOR.isAgencyRole).toBe(false);
    expect(SYSTEM_ROLES.LEARNER.isAgencyRole).toBe(false);
  });

  it('learner has MENTORING_VIEW_ASSIGNED but not MENTORING_VIEW_ALL', () => {
    expect(SYSTEM_ROLES.LEARNER.permissions).toContain(PERMISSIONS.MENTORING_VIEW_ASSIGNED);
    expect(SYSTEM_ROLES.LEARNER.permissions).not.toContain(PERMISSIONS.MENTORING_VIEW_ALL);
  });

  it('mentor has MENTORING_VIEW_ASSIGNED but not MENTORING_MANAGE', () => {
    expect(SYSTEM_ROLES.MENTOR.permissions).toContain(PERMISSIONS.MENTORING_VIEW_ASSIGNED);
    expect(SYSTEM_ROLES.MENTOR.permissions).not.toContain(PERMISSIONS.MENTORING_MANAGE);
  });

  it('tenant_admin has MENTORING_MANAGE and MENTORING_VIEW_ALL', () => {
    expect(SYSTEM_ROLES.TENANT_ADMIN.permissions).toContain(PERMISSIONS.MENTORING_MANAGE);
    expect(SYSTEM_ROLES.TENANT_ADMIN.permissions).toContain(PERMISSIONS.MENTORING_VIEW_ALL);
  });

  it('facilitator has PROGRAMS_MANAGE but not PROGRAMS_CREATE', () => {
    expect(SYSTEM_ROLES.FACILITATOR.permissions).toContain(PERMISSIONS.PROGRAMS_MANAGE);
    expect(SYSTEM_ROLES.FACILITATOR.permissions).not.toContain(PERMISSIONS.PROGRAMS_CREATE);
  });
});

describe('getRoleBySlug', () => {
  it('returns role definition for valid slugs', () => {
    const role = getRoleBySlug('learner');
    expect(role).toBeDefined();
    expect(role!.name).toBe('Learner');
    expect(role!.level).toBe(ROLE_LEVELS.LEARNER);
  });

  it('returns agency_owner correctly', () => {
    const role = getRoleBySlug('agency_owner');
    expect(role).toBeDefined();
    expect(role!.level).toBe(ROLE_LEVELS.AGENCY_OWNER);
    expect(role!.isAgencyRole).toBe(true);
  });

  it('returns undefined for unknown slug', () => {
    expect(getRoleBySlug('superuser')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getRoleBySlug('')).toBeUndefined();
  });
});

describe('hasMinimumRoleLevel', () => {
  it('returns true when userLevel equals requiredLevel', () => {
    expect(hasMinimumRoleLevel(50, 50)).toBe(true);
  });

  it('returns true when userLevel exceeds requiredLevel', () => {
    expect(hasMinimumRoleLevel(100, 50)).toBe(true);
  });

  it('returns false when userLevel is below requiredLevel', () => {
    expect(hasMinimumRoleLevel(10, 50)).toBe(false);
  });

  it('correctly identifies learner below tenant_admin threshold', () => {
    expect(hasMinimumRoleLevel(ROLE_LEVELS.LEARNER, ROLE_LEVELS.TENANT_ADMIN)).toBe(false);
  });

  it('correctly identifies tenant_admin above facilitator threshold', () => {
    expect(hasMinimumRoleLevel(ROLE_LEVELS.TENANT_ADMIN, ROLE_LEVELS.FACILITATOR)).toBe(true);
  });
});
