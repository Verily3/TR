import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  integer,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, users, programRoleEnum } from "./core";

// ============================================================================
// ENUMS
// ============================================================================

export const programTypeEnum = pgEnum("program_type", [
  "cohort",      // Interaction with other learners enabled
  "individual",  // Self-paced, no peer interaction
]);

export const programScheduleTypeEnum = pgEnum("program_schedule_type", [
  "fixed",       // Same start/end dates for all
  "individual",  // Each participant has own timeline
]);

export const programStatusEnum = pgEnum("program_status", [
  "draft",
  "published",
  "archived",
]);

export const lessonTypeEnum = pgEnum("lesson_type", [
  "reading",
  "video",
  "meeting",
  "submission",
  "assignment",
  "assessment",
  "goal",
  "reflection",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "invited",
  "active",
  "completed",
  "withdrawn",
  "expired",
]);

export const progressStatusEnum = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "completed",
  "locked",
]);

// ============================================================================
// PROGRAM TEMPLATES (Agency-level reusable templates)
// ============================================================================

export const programTemplates = pgTable("program_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull(), // Reference to agencies

  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),

  // Template structure stored as JSON
  structure: jsonb("structure").default({}),

  // Default settings
  defaultType: programTypeEnum("default_type").default("cohort"),
  defaultScheduleType: programScheduleTypeEnum("default_schedule_type").default("fixed"),
  defaultDurationMonths: integer("default_duration_months").default(3),
  defaultReminders: jsonb("default_reminders").default({}),

  // Status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// PROGRAMS
// ============================================================================

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => programTemplates.id),

  // Basic info
  name: text("name").notNull(),
  internalName: varchar("internal_name", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),

  // Branding
  imageUrl: text("image_url"),

  // Type and schedule
  type: programTypeEnum("type").notNull().default("cohort"),
  scheduleType: programScheduleTypeEnum("schedule_type").notNull().default("fixed"),

  // Fixed schedule dates (if scheduleType is 'fixed')
  startDate: date("start_date"),
  endDate: date("end_date"),

  // Individual schedule (if scheduleType is 'individual')
  accessPeriodMonths: integer("access_period_months").default(12),

  // Settings
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),

  // Support
  supportEmail: text("support_email"),
  supportPhone: text("support_phone"),

  // Reminders
  reminderDayBefore: boolean("reminder_day_before").default(true),
  reminderDayAfter: boolean("reminder_day_after").default(true),
  reminderSettings: jsonb("reminder_settings").default({}),

  // Access settings
  allowOpenAccess: boolean("allow_open_access").default(false),
  allowLearnerInviteCoach: boolean("allow_learner_invite_coach").default(false),
  showLogotypeInEmails: boolean("show_logotype_in_emails").default(true),

  // Completion
  completionCriteria: jsonb("completion_criteria").default({}),
  diplomaTemplateId: uuid("diploma_template_id"),

  // Status
  status: programStatusEnum("status").notNull().default("draft"),

  // Creator
  createdById: uuid("created_by_id").references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// PROGRAM ADMINS (Per-program administrators)
// ============================================================================

export const programAdmins = pgTable("program_admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// MODULES (Phases/sections within a program)
// ============================================================================

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),

  // Basic info
  name: text("name").notNull(),
  description: text("description"),

  // Ordering
  orderIndex: integer("order_index").notNull().default(0),

  // Unlock settings
  unlockAfterDays: integer("unlock_after_days"), // Days after program start
  unlockAfterModuleId: uuid("unlock_after_module_id"), // Prerequisite module
  isLocked: boolean("is_locked").default(false),

  // Duration
  estimatedMinutes: integer("estimated_minutes"),

  // Status
  status: contentStatusEnum("status").notNull().default("draft"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// LESSONS (Individual learning items within modules)
// ============================================================================

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),

  // Basic info
  name: text("name").notNull(),
  description: text("description"),
  type: lessonTypeEnum("type").notNull().default("reading"),

  // Ordering
  orderIndex: integer("order_index").notNull().default(0),

  // Content
  content: jsonb("content").default({}), // Rich content stored as JSON
  videoUrl: text("video_url"),
  videoTranscript: text("video_transcript"),

  // Duration and points
  estimatedMinutes: integer("estimated_minutes"),
  points: integer("points").default(0),

  // Requirements
  isRequired: boolean("is_required").default(true),

  // Status
  status: contentStatusEnum("status").notNull().default("draft"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// LESSON RESOURCES (Attachments, downloads for lessons)
// ============================================================================

export const lessonResources = pgTable("lesson_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: integer("file_size"),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// PROGRAM ENROLLMENTS
// ============================================================================

export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Role in this program
  role: programRoleEnum("role").notNull().default("learner"),

  // Status
  status: enrollmentStatusEnum("status").notNull().default("invited"),

  // Individual schedule (for individual schedule type)
  individualStartDate: date("individual_start_date"),
  individualEndDate: date("individual_end_date"),

  // Progress
  progress: integer("progress").default(0), // 0-100
  pointsEarned: integer("points_earned").default(0),
  engagementScore: integer("engagement_score").default(0),

  // Mentor assignment
  mentorId: uuid("mentor_id").references(() => users.id),

  // Completion
  completedAt: timestamp("completed_at"),
  certificateUrl: text("certificate_url"),
  certificateIssuedAt: timestamp("certificate_issued_at"),

  // Timestamps
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// LESSON PROGRESS (Track progress per user per lesson)
// ============================================================================

export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),

  // Status
  status: progressStatusEnum("status").notNull().default("not_started"),

  // Progress tracking
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at"),

  // Video progress (if applicable)
  videoProgress: integer("video_progress").default(0), // seconds watched
  videoCompleted: boolean("video_completed").default(false),

  // Points
  pointsEarned: integer("points_earned").default(0),

  // Time spent
  timeSpentSeconds: integer("time_spent_seconds").default(0),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// LESSON SUBMISSIONS (User responses to exercises, assignments)
// ============================================================================

export const lessonSubmissions = pgTable("lesson_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonProgressId: uuid("lesson_progress_id").notNull().references(() => lessonProgress.id, { onDelete: "cascade" }),

  // Submission content
  content: jsonb("content").notNull(), // User's responses stored as JSON
  attachments: jsonb("attachments").default([]), // File URLs

  // Review (by mentor/facilitator)
  reviewedById: uuid("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  score: integer("score"),

  // Status
  status: varchar("status", { length: 50 }).default("submitted"), // submitted, reviewed, needs_revision

  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// PROGRAM GROUPS (For cohort-based programs)
// ============================================================================

export const programGroups = pgTable("program_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programGroupMembers = pgTable("program_group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => programGroups.id, { onDelete: "cascade" }),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ENROLLMENT MENTORSHIPS (Many-to-many mentor-learner relationships)
// ============================================================================

export const enrollmentMentorships = pgTable("enrollment_mentorships", {
  id: uuid("id").primaryKey().defaultRandom(),

  // The learner's enrollment
  learnerEnrollmentId: uuid("learner_enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),

  // The mentor's enrollment
  mentorEnrollmentId: uuid("mentor_enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const programsRelations = relations(programs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [programs.tenantId],
    references: [tenants.id],
  }),
  template: one(programTemplates, {
    fields: [programs.templateId],
    references: [programTemplates.id],
  }),
  createdBy: one(users, {
    fields: [programs.createdById],
    references: [users.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
  admins: many(programAdmins),
  groups: many(programGroups),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  program: one(programs, {
    fields: [modules.programId],
    references: [programs.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  resources: many(lessonResources),
  progress: many(lessonProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  program: one(programs, {
    fields: [enrollments.programId],
    references: [programs.id],
  }),
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  mentor: one(users, {
    fields: [enrollments.mentorId],
    references: [users.id],
  }),
  lessonProgress: many(lessonProgress),
  // Many-to-many mentorship relationships
  mentorships: many(enrollmentMentorships, { relationName: "learnerMentorships" }),
  learners: many(enrollmentMentorships, { relationName: "mentorLearners" }),
}));

export const enrollmentMentorshipsRelations = relations(enrollmentMentorships, ({ one }) => ({
  learnerEnrollment: one(enrollments, {
    fields: [enrollmentMentorships.learnerEnrollmentId],
    references: [enrollments.id],
    relationName: "learnerMentorships",
  }),
  mentorEnrollment: one(enrollments, {
    fields: [enrollmentMentorships.mentorEnrollmentId],
    references: [enrollments.id],
    relationName: "mentorLearners",
  }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [lessonProgress.enrollmentId],
    references: [enrollments.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
  submissions: many(lessonSubmissions),
}));

export const lessonSubmissionsRelations = relations(lessonSubmissions, ({ one }) => ({
  lessonProgress: one(lessonProgress, {
    fields: [lessonSubmissions.lessonProgressId],
    references: [lessonProgress.id],
  }),
  reviewedBy: one(users, {
    fields: [lessonSubmissions.reviewedById],
    references: [users.id],
  }),
}));
