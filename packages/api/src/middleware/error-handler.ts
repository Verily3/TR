import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError } from '../lib/errors.js';

/**
 * Global error handler using Hono's app.onError() pattern
 */
export const errorHandler: ErrorHandler = (error, c) => {
  console.error('Error:', error);

  // Handle our custom AppError
  if (error instanceof AppError) {
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      error.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    );
  }

  // Handle Hono HTTPException
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: 'HTTP_ERROR',
          message: error.message,
        },
      },
      error.status
    );
  }

  // Handle unknown errors
  const message =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    },
    500
  );
};
