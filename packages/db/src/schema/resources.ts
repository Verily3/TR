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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, users } from "./core";
import { programs } from "./programs";

// ============================================================================
// ENUMS
// ============================================================================

export const resourceTypeEnum = pgEnum("resource_type", [
  "document",
  "video",
  "audio",
  "image",
  "link",
  "template",
  "other",
]);

export const resourceVisibilityEnum = pgEnum("resource_visibility", [
  "global",     // Available to all subaccounts (agency library)
  "tenant",     // Available within a tenant
  "program",    // Available within a specific program
  "private",    // Only visible to uploader
]);

// ============================================================================
// RESOURCES (Global and tenant-level resource library)
// ============================================================================

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Scope (one of these should be set)
  agencyId: uuid("agency_id"), // Global resource
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  programId: uuid("program_id").references(() => programs.id, { onDelete: "cascade" }),

  // Basic info
  name: text("name").notNull(),
  description: text("description"),
  type: resourceTypeEnum("type").notNull().default("document"),

  // File info
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }),

  // External link (for link type)
  externalUrl: text("external_url"),

  // Metadata
  tags: jsonb("tags").default([]),
  category: varchar("category", { length: 100 }),

  // Visibility
  visibility: resourceVisibilityEnum("visibility").notNull().default("tenant"),

  // Tracking
  downloadCount: integer("download_count").default(0),
  viewCount: integer("view_count").default(0),

  // Uploaded by
  uploadedById: uuid("uploaded_by_id").references(() => users.id),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RESOURCE FOLDERS (Organization structure)
// ============================================================================

export const resourceFolders = pgTable("resource_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  agencyId: uuid("agency_id"),

  name: text("name").notNull(),
  parentId: uuid("parent_id"),

  // Ordering
  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RESOURCE FOLDER ITEMS (Resources in folders)
// ============================================================================

export const resourceFolderItems = pgTable("resource_folder_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").notNull().references(() => resourceFolders.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const resourcesRelations = relations(resources, ({ one }) => ({
  tenant: one(tenants, {
    fields: [resources.tenantId],
    references: [tenants.id],
  }),
  program: one(programs, {
    fields: [resources.programId],
    references: [programs.id],
  }),
  uploadedBy: one(users, {
    fields: [resources.uploadedById],
    references: [users.id],
  }),
}));

export const resourceFoldersRelations = relations(resourceFolders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [resourceFolders.tenantId],
    references: [tenants.id],
  }),
  parent: one(resourceFolders, {
    fields: [resourceFolders.parentId],
    references: [resourceFolders.id],
  }),
  items: many(resourceFolderItems),
}));
