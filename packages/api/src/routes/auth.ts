import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { db, eq, users, tenantMembers, agencyMembers } from "@tr/db";
import { getFirebaseAuth } from "../lib/firebase";
import { success } from "../lib/response";
import { authMiddleware } from "../middleware";
import type { AppVariables } from "../types";

const auth = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const registerSchema = z.object({
  firebaseToken: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  inviteToken: z.string().optional(), // For accepting invites
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  timezone: z.string().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /auth/register
 * Register a new user after Firebase authentication
 */
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");

  // Verify Firebase token
  const firebaseAuth = getFirebaseAuth();
  let decodedToken;

  try {
    decodedToken = await firebaseAuth.verifyIdToken(body.firebaseToken);
  } catch {
    throw new HTTPException(401, { message: "Invalid Firebase token" });
  }

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.authProviderId, decodedToken.uid),
  });

  if (existingUser) {
    throw new HTTPException(409, { message: "User already registered" });
  }

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      authProviderId: decodedToken.uid,
      email: decodedToken.email || "",
      firstName: body.firstName,
      lastName: body.lastName,
      emailVerified: decodedToken.email_verified || false,
    })
    .returning();

  // TODO: Handle invite token - add user to tenant/agency

  return success(
    c,
    {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    },
    201
  );
});

/**
 * GET /auth/me
 * Get current user profile with memberships
 */
auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");

  // Fetch full user with memberships
  const fullUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  // Get tenant memberships
  const tenantMemberships = await db.query.tenantMembers.findMany({
    where: eq(tenantMembers.userId, user.id),
    with: {
      tenant: true,
    },
  });

  // Get agency memberships
  const agencyMemberships = await db.query.agencyMembers.findMany({
    where: eq(agencyMembers.userId, user.id),
    with: {
      agency: true,
    },
  });

  return success(c, {
    user: {
      id: fullUser!.id,
      email: fullUser!.email,
      firstName: fullUser!.firstName,
      lastName: fullUser!.lastName,
      avatarUrl: fullUser!.avatarUrl,
      phone: fullUser!.phone,
      timezone: fullUser!.timezone,
    },
    tenants: tenantMemberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role,
      logoUrl: m.tenant.logoUrl,
    })),
    agencies: agencyMemberships.map((m) => ({
      id: m.agency.id,
      name: m.agency.name,
      role: m.role,
    })),
  });
});

/**
 * PATCH /auth/me
 * Update current user profile
 */
auth.patch(
  "/me",
  authMiddleware,
  zValidator("json", profileUpdateSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const [updatedUser] = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return success(c, {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      avatarUrl: updatedUser.avatarUrl,
      phone: updatedUser.phone,
      timezone: updatedUser.timezone,
    });
  }
);

export { auth };
