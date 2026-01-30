import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const agencyRoleEnum = pgEnum("agency_role", [
  "owner",
  "admin",
  "support",
  "analyst",
]);

export const accountRoleEnum = pgEnum("account_role", [
  "admin",
  "user",
]);

export const programRoleEnum = pgEnum("program_role", [
  "facilitator",
  "mentor",
  "learner",
]);

// ============================================================================
// AGENCIES (Parent accounts that manage multiple client subaccounts)
// ============================================================================

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),

  // Branding (default theme for subaccounts)
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),

  // Settings
  settings: jsonb("settings").default({}),

  // Billing
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// TENANTS (Client subaccounts)
// ============================================================================

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),

  // Branding (overrides agency defaults)
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),

  // Contact
  supportEmail: text("support_email"),
  supportPhone: text("support_phone"),

  // Settings
  settings: jsonb("settings").default({}),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),

  // Status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// USERS (All users across the platform)
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Firebase Auth ID (external auth provider)
  authProviderId: text("auth_provider_id").unique(),

  // Basic info
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),

  // Profile
  title: text("title"), // Job title
  department: text("department"),
  organization: text("organization"),
  bio: text("bio"),
  notes: text("notes"), // Admin notes about the user

  // Preferences
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  notificationPreferences: jsonb("notification_preferences").default({}),

  // Status
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// AGENCY MEMBERS (Users who belong to an agency with agency-level roles)
// ============================================================================

export const agencyMembers = pgTable("agency_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  role: agencyRoleEnum("role").notNull().default("support"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// TENANT MEMBERS (Users who belong to a tenant/subaccount)
// ============================================================================

export const tenantMembers = pgTable("tenant_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  role: accountRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").default(true),

  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: varchar("onboarding_step", { length: 50 }),

  // Manager relationship (for org hierarchy)
  managerId: uuid("manager_id").references(() => users.id),

  // Timestamps
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// INVITATIONS
// ============================================================================

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  email: text("email").notNull(),
  role: accountRoleEnum("role").notNull().default("user"),

  // Invitation details
  invitedById: uuid("invited_by_id").references(() => users.id),
  token: text("token").notNull().unique(),
  message: text("message"),

  // Status
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, expired, revoked
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),

  // If invitation is to a specific program
  programId: uuid("program_id"),
  programRole: programRoleEnum("program_role"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// AUDIT LOG
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Context
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "user.created", "program.updated"
  entityType: varchar("entity_type", { length: 100 }), // e.g., "user", "program", "goal"
  entityId: uuid("entity_id"),

  // Change data
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),

  // Request context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const agenciesRelations = relations(agencies, ({ many }) => ({
  tenants: many(tenants),
  members: many(agencyMembers),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [tenants.agencyId],
    references: [agencies.id],
  }),
  members: many(tenantMembers),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  agencyMemberships: many(agencyMembers),
  tenantMemberships: many(tenantMembers),
}));

export const agencyMembersRelations = relations(agencyMembers, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencyMembers.agencyId],
    references: [agencies.id],
  }),
  user: one(users, {
    fields: [agencyMembers.userId],
    references: [users.id],
  }),
}));

export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantMembers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantMembers.userId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [tenantMembers.managerId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenantId],
    references: [tenants.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));
