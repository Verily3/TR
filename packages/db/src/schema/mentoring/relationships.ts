import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../core/users';
import { tenants } from '../core/tenants';

/**
 * Mentoring relationship type enum
 */
export const mentoringRelationshipTypeEnum = pgEnum('mentoring_relationship_type', [
  'mentor',     // Traditional mentoring relationship
  'coach',      // Coaching relationship (external or internal)
  'manager',    // Manager-direct report 1:1s
  'peer',       // Peer mentoring
]);

/**
 * Mentoring relationship status enum
 */
export const mentoringRelationshipStatusEnum = pgEnum('mentoring_relationship_status', [
  'active',
  'paused',
  'ended',
]);

/**
 * Meeting preferences
 */
export interface MeetingPreferences {
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'as_needed';
  duration?: number; // minutes
  preferredDay?: string;
  preferredTime?: string;
  location?: string;
  videoLink?: string;
}

/**
 * Mentoring relationships table - ongoing mentoring pairings outside of programs
 *
 * Supports various relationship types: mentor, coach, manager, peer.
 * Each relationship can have its own meeting preferences and notes.
 */
export const mentoringRelationships = pgTable(
  'mentoring_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // The mentor/coach
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // The mentee (person being mentored)
    menteeId: uuid('mentee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Relationship type and status
    relationshipType: mentoringRelationshipTypeEnum('relationship_type')
      .notNull()
      .default('mentor'),
    status: mentoringRelationshipStatusEnum('status')
      .notNull()
      .default('active'),

    // Meeting preferences
    meetingPreferences: jsonb('meeting_preferences')
      .$type<MeetingPreferences>()
      .default({}),

    // Relationship details
    description: text('description'),
    goals: text('goals'),

    // Timeline
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('mentoring_relationships_unique').on(
      table.mentorId,
      table.menteeId,
      table.relationshipType
    ),
    index('mentoring_relationships_tenant_idx').on(table.tenantId),
    index('mentoring_relationships_mentor_idx').on(table.mentorId),
    index('mentoring_relationships_mentee_idx').on(table.menteeId),
    index('mentoring_relationships_status_idx').on(table.status),
  ]
);

export const mentoringRelationshipsRelations = relations(
  mentoringRelationships,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [mentoringRelationships.tenantId],
      references: [tenants.id],
    }),
    mentor: one(users, {
      fields: [mentoringRelationships.mentorId],
      references: [users.id],
      relationName: 'asMentor',
    }),
    mentee: one(users, {
      fields: [mentoringRelationships.menteeId],
      references: [users.id],
      relationName: 'asMentee',
    }),
  })
);

export type MentoringRelationship = typeof mentoringRelationships.$inferSelect;
export type NewMentoringRelationship = typeof mentoringRelationships.$inferInsert;
