import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { programs } from './programs';
import { lessons } from './lessons';
import { users } from '../core/users';

export const programResources = pgTable(
  'program_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id').references(() => lessons.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: integer('file_size').notNull(),
    category: varchar('category', { length: 50 }).notNull().default('document'),
    externalUrl: text('external_url'),
    order: integer('order').notNull().default(0),
    uploadedBy: uuid('uploaded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('program_resources_program_id_idx').on(table.programId),
    index('program_resources_lesson_id_idx').on(table.lessonId),
  ]
);
