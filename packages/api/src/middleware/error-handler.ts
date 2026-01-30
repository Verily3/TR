import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { ErrorHandler } from "hono";
import type { AppVariables } from "../types";

export const errorHandler: ErrorHandler<{ Variables: AppVariables }> = (
  err,
  c
) => {
  const requestId = c.get("requestId") || "unknown";

  // Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        requestId,
      },
      400
    );
  }

  // HTTP exceptions (from our middleware)
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: getErrorCode(err.status),
          message: err.message,
        },
        requestId,
      },
      err.status
    );
  }

  // Unknown errors
  console.error(`[${requestId}] Unhandled error:`, err);

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err instanceof Error
              ? err.message
              : "Unknown error",
      },
      requestId,
    },
    500
  );
};

function getErrorCode(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "ERROR";
  }
}
