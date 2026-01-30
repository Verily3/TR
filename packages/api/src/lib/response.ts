import type { Context } from "hono";
import type { ApiResponse } from "../types";

/**
 * Success response helper
 */
export function success<T>(
  c: Context,
  data: T,
  status: 200 | 201 = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return c.json(response, status);
}

/**
 * Paginated response helper
 */
export function paginated<T>(
  c: Context,
  data: T[],
  meta: {
    page: number;
    perPage: number;
    total: number;
  }
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      page: meta.page,
      perPage: meta.perPage,
      total: meta.total,
      totalPages: Math.ceil(meta.total / meta.perPage),
    },
  };
  return c.json(response, 200);
}

/**
 * No content response (204)
 */
export function noContent(c: Context): Response {
  return c.body(null, 204);
}
