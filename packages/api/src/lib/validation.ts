import { z } from "zod";

// Common validation schemas
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const listQuerySchema = paginationSchema.merge(searchSchema).merge(sortSchema);

// ID parameter schema
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Tenant ID parameter schema
export const tenantIdParamSchema = z.object({
  tenantId: uuidSchema,
});

// Common field schemas
export const emailSchema = z.string().email();
export const urlSchema = z.string().url().optional();
export const dateSchema = z.string().datetime().optional();
export const nonEmptyString = z.string().min(1);
