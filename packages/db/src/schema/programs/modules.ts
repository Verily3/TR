import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { programs } from './programs';

/**
 * Module drip type enum
 */
export const moduleDripTypeEnum = pgEnum('module_drip_type', [
  'immediate',
  'days_after_enrollment',
  'days_after_previous',
  'on_date',
]);

/**
 * Module status enum
 */
export const moduleStatusEnum = pgEnum('module_status', ['draft', 'active']);

/**
 * Modules table - sections within a program
 */
export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    parentModuleId: uuid('parent_module_id'), // Self-reference for sub-modules

    // Content
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Ordering and hierarchy
    order: integer('order').notNull().default(0),
    depth: integer('depth').notNull().default(0), // 0=top-level, 1=sub-module

    // Drip scheduling
    dripType: moduleDripTypeEnum('drip_type').notNull().default('immediate'),
    dripValue: integer('drip_value'), // days or null for 'immediate'
    dripDate: timestamp('drip_date', { withTimezone: true }), // for 'on_date' type

    // Status
    status: moduleStatusEnum('status').notNull().default('draft'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('modules_program_id_idx').on(table.programId),
    index('modules_parent_module_id_idx').on(table.parentModuleId),
    index('modules_order_idx').on(table.programId, table.order),
  ]
);

// Forward declare
import { lessons } from './lessons';

export const modulesRelations = relations(modules, ({ one, many }) => ({
  program: one(programs, {
    fields: [modules.programId],
    references: [programs.id],
  }),
  parentModule: one(modules, {
    fields: [modules.parentModuleId],
    references: [modules.id],
    relationName: 'subModules',
  }),
  subModules: many(modules, { relationName: 'subModules' }),
  lessons: many(lessons),
}));

export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
