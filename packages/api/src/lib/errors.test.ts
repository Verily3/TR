import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  BadRequestError,
} from './errors.js';

describe('AppError', () => {
  it('stores statusCode, code, message, and details', () => {
    const err = new AppError(422, 'UNPROCESSABLE', 'bad input', { field: 'email' });
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('UNPROCESSABLE');
    expect(err.message).toBe('bad input');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('extends Error', () => {
    const err = new AppError(500, 'X', 'msg');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
  });

  it('details is undefined when not provided', () => {
    const err = new AppError(400, 'X', 'msg');
    expect(err.details).toBeUndefined();
  });
});

describe('NotFoundError', () => {
  it('includes resource and id in message', () => {
    const err = new NotFoundError('User', 'abc-123');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe("User with id 'abc-123' not found");
  });

  it('omits id when not provided', () => {
    const err = new NotFoundError('Program');
    expect(err.message).toBe('Program not found');
  });

  it('is instanceof AppError', () => {
    expect(new NotFoundError('X')).toBeInstanceOf(AppError);
  });
});

describe('ForbiddenError', () => {
  it('has default message', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('Access denied');
  });

  it('accepts custom message', () => {
    const err = new ForbiddenError('Not your resource');
    expect(err.message).toBe('Not your resource');
  });
});

describe('UnauthorizedError', () => {
  it('has default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Authentication required');
  });
});

describe('ValidationError', () => {
  it('stores field errors in details', () => {
    const errors = { email: ['invalid format'], name: ['too short'] };
    const err = new ValidationError(errors);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Validation failed');
    expect(err.details).toEqual({ errors });
  });
});

describe('ConflictError', () => {
  it('uses 409 status', () => {
    const err = new ConflictError('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Email already exists');
  });
});

describe('BadRequestError', () => {
  it('uses 400 status', () => {
    const err = new BadRequestError('Missing required field');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Missing required field');
  });
});
