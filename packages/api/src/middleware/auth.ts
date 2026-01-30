import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getFirebaseAuth } from "../lib/firebase";
import { db, eq, users } from "@tr/db";
import type { AppVariables, AuthUser, CurrentUser } from "../types";
import { env } from "../lib/env";

/**
 * Check if token is a mock token and parse it
 * Mock tokens have format: mock-token::uid::email
 */
function parseMockToken(token: string): { uid: string; email: string } | null {
  if (!token.startsWith("mock-token::")) return null;
  const parts = token.split("::");
  if (parts.length !== 3) return null;
  return { uid: parts[1], email: parts[2] };
}

/**
 * Authentication middleware - verifies Firebase token or mock token
 * Sets authUser and user in context
 */
export const authMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, {
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);

    try {
      // Check for mock token (only in development)
      const mockData = parseMockToken(token);

      if (mockData && env.NODE_ENV === "development") {
        // Handle mock authentication
        const authUser: AuthUser = {
          uid: mockData.uid,
          email: mockData.email,
          emailVerified: true,
        };

        c.set("authUser", authUser);

        // For mock auth, look up user by email instead of authProviderId
        let dbUser = await db.query.users.findFirst({
          where: eq(users.email, mockData.email),
        });

        // If no user found by email, try by authProviderId (for seeded users)
        if (!dbUser) {
          dbUser = await db.query.users.findFirst({
            where: eq(users.authProviderId, mockData.uid),
          });
        }

        if (!dbUser) {
          throw new HTTPException(401, {
            message: "User not found in database. Try logging in with a seeded user email (e.g., admin@acme.com)",
          });
        }

        if (!dbUser.isActive) {
          throw new HTTPException(403, {
            message: "User account is deactivated",
          });
        }

        const currentUser: CurrentUser = {
          id: dbUser.id,
          authProviderId: dbUser.authProviderId,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          avatarUrl: dbUser.avatarUrl,
        };

        c.set("user", currentUser);
        await next();
        return;
      }

      // Real Firebase authentication
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(token);

      const authUser: AuthUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        emailVerified: decodedToken.email_verified || false,
      };

      c.set("authUser", authUser);

      // Fetch user from database
      const dbUser = await db.query.users.findFirst({
        where: eq(users.authProviderId, decodedToken.uid),
      });

      if (!dbUser) {
        throw new HTTPException(401, {
          message: "User not found in database",
        });
      }

      if (!dbUser.isActive) {
        throw new HTTPException(403, {
          message: "User account is deactivated",
        });
      }

      const currentUser: CurrentUser = {
        id: dbUser.id,
        authProviderId: dbUser.authProviderId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        avatarUrl: dbUser.avatarUrl,
      };

      c.set("user", currentUser);

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error("Auth error:", error);
      throw new HTTPException(401, {
        message: "Invalid or expired token",
      });
    }
  }
);

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for public endpoints that behave differently for authenticated users
 */
export const optionalAuthMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(token);

      const authUser: AuthUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        emailVerified: decodedToken.email_verified || false,
      };

      c.set("authUser", authUser);

      const dbUser = await db.query.users.findFirst({
        where: eq(users.authProviderId, decodedToken.uid),
      });

      if (dbUser && dbUser.isActive) {
        const currentUser: CurrentUser = {
          id: dbUser.id,
          authProviderId: dbUser.authProviderId,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          avatarUrl: dbUser.avatarUrl,
        };

        c.set("user", currentUser);
      }
    } catch {
      // Silently ignore auth errors for optional auth
    }

    await next();
  }
);
