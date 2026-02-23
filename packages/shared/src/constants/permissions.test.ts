import { describe, it, expect } from 'vitest';
import { PERMISSIONS, ROLE_LEVELS } from './permissions.js';

describe('PERMISSIONS', () => {
  it('has no duplicate values', () => {
    const values = Object.values(PERMISSIONS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('all values follow resource:action or resource:action:scope format', () => {
    for (const [key, value] of Object.entries(PERMISSIONS)) {
      const parts = value.split(':');
      expect(parts.length, `${key} = "${value}" should have 2-3 colon-separated parts`).toBeGreaterThanOrEqual(2);
      expect(parts.length, `${key} = "${value}" should have 2-3 colon-separated parts`).toBeLessThanOrEqual(3);
      for (const part of parts) {
        expect(part.length, `${key} has empty segment in "${value}"`).toBeGreaterThan(0);
      }
    }
  });

  it('contains expected core permissions', () => {
    expect(PERMISSIONS.AGENCY_MANAGE).toBe('agency:manage');
    expect(PERMISSIONS.PROGRAMS_VIEW).toBe('programs:view');
    expect(PERMISSIONS.MENTORING_VIEW_ASSIGNED).toBe('mentoring:view:assigned');
  });
});

describe('ROLE_LEVELS', () => {
  it('has correct hierarchy ordering', () => {
    expect(ROLE_LEVELS.AGENCY_OWNER).toBeGreaterThan(ROLE_LEVELS.AGENCY_ADMIN);
    expect(ROLE_LEVELS.AGENCY_ADMIN).toBeGreaterThan(ROLE_LEVELS.TENANT_ADMIN);
    expect(ROLE_LEVELS.TENANT_ADMIN).toBeGreaterThan(ROLE_LEVELS.FACILITATOR);
    expect(ROLE_LEVELS.FACILITATOR).toBeGreaterThan(ROLE_LEVELS.MENTOR);
    expect(ROLE_LEVELS.MENTOR).toBeGreaterThan(ROLE_LEVELS.LEARNER);
  });

  it('has all unique values', () => {
    const values = Object.values(ROLE_LEVELS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('has expected specific values', () => {
    expect(ROLE_LEVELS.AGENCY_OWNER).toBe(100);
    expect(ROLE_LEVELS.LEARNER).toBe(10);
  });
});
