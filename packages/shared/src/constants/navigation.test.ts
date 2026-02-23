import { describe, it, expect } from 'vitest';
import { NAVIGATION_BY_ROLE, getNavigationForRole, canAccessNavItem } from './navigation.js';

describe('NAVIGATION_BY_ROLE', () => {
  it('learner does not have mentoring', () => {
    expect(NAVIGATION_BY_ROLE.learner).not.toContain('mentoring');
  });

  it('mentor has mentoring', () => {
    expect(NAVIGATION_BY_ROLE.mentor).toContain('mentoring');
  });

  it('facilitator has mentoring', () => {
    expect(NAVIGATION_BY_ROLE.facilitator).toContain('mentoring');
  });

  it('tenant_admin has planning, scorecard, analytics', () => {
    expect(NAVIGATION_BY_ROLE.tenant_admin).toContain('planning');
    expect(NAVIGATION_BY_ROLE.tenant_admin).toContain('scorecard');
    expect(NAVIGATION_BY_ROLE.tenant_admin).toContain('analytics');
  });

  it('agency_owner has agency and program-builder', () => {
    expect(NAVIGATION_BY_ROLE.agency_owner).toContain('agency');
    expect(NAVIGATION_BY_ROLE.agency_owner).toContain('program-builder');
  });

  it('all roles have dashboard, notifications, help, settings', () => {
    for (const [role, items] of Object.entries(NAVIGATION_BY_ROLE)) {
      expect(items, `${role} should have dashboard`).toContain('dashboard');
      expect(items, `${role} should have notifications`).toContain('notifications');
      expect(items, `${role} should have help`).toContain('help');
      expect(items, `${role} should have settings`).toContain('settings');
    }
  });
});

describe('getNavigationForRole', () => {
  it('returns correct items for learner', () => {
    const items = getNavigationForRole('learner');
    expect(items).toContain('programs');
    expect(items).not.toContain('mentoring');
    expect(items).not.toContain('planning');
  });

  it('returns correct items for tenant_admin', () => {
    const items = getNavigationForRole('tenant_admin');
    expect(items).toContain('programs');
    expect(items).toContain('mentoring');
    expect(items).toContain('planning');
    expect(items).toContain('people');
    expect(items).toContain('surveys');
  });

  it('returns correct items for agency_owner', () => {
    const items = getNavigationForRole('agency_owner');
    expect(items).toContain('agency');
    expect(items).toContain('program-builder');
    expect(items).not.toContain('planning');
    expect(items).not.toContain('scorecard');
  });

  it('falls back to learner items for unknown role', () => {
    const items = getNavigationForRole('superuser');
    expect(items).toEqual(NAVIGATION_BY_ROLE.learner);
  });
});

describe('canAccessNavItem', () => {
  it('returns true for item in role list', () => {
    expect(canAccessNavItem('mentor', 'mentoring')).toBe(true);
  });

  it('returns false for item not in role list', () => {
    expect(canAccessNavItem('learner', 'mentoring')).toBe(false);
  });

  it('learner cannot access planning', () => {
    expect(canAccessNavItem('learner', 'planning')).toBe(false);
  });

  it('tenant_admin can access planning', () => {
    expect(canAccessNavItem('tenant_admin', 'planning')).toBe(true);
  });

  it('agency_owner can access program-builder', () => {
    expect(canAccessNavItem('agency_owner', 'program-builder')).toBe(true);
  });

  it('tenant_admin cannot access program-builder', () => {
    expect(canAccessNavItem('tenant_admin', 'program-builder')).toBe(false);
  });

  it('unknown role cannot access agency', () => {
    expect(canAccessNavItem('unknown_role', 'agency')).toBe(false);
  });
});
