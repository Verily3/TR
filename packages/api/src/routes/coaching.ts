import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  db,
  eq,
  and,
  or,
  sql,
  gt,
  lt,
  coachingRelationships,
  coachingSessions,
  sessionPrep,
  sessionNotes,
  coachingActionItems,
  coachingHistory,
  users,
} from "@tr/db";
import { success, paginated, noContent } from "../lib/response";
import { listQuerySchema } from "../lib/validation";
import {
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
} from "../middleware";
import type { AppVariables } from "../types";

const coachingRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const createRelationshipSchema = z.object({
  coachId: z.string().uuid(),
  coacheeId: z.string().uuid(),
  relationshipType: z.enum(["mentor", "coach", "manager"]).default("mentor"),
  defaultDurationMinutes: z.number().int().min(15).max(480).default(60),
  preferredDay: z.string().max(20).optional(),
  preferredTime: z.string().max(20).optional(),
  meetingFrequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
});

const updateRelationshipSchema = z.object({
  isActive: z.boolean().optional(),
  defaultDurationMinutes: z.number().int().min(15).max(480).optional(),
  preferredDay: z.string().max(20).optional(),
  preferredTime: z.string().max(20).optional(),
  meetingFrequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
});

const createSessionSchema = z.object({
  relationshipId: z.string().uuid().optional(),
  coachId: z.string().uuid(),
  coacheeId: z.string().uuid(),
  title: z.string().max(255).optional(),
  type: z.enum(["coaching", "one_on_one", "check_in", "review", "planning"]).default("coaching"),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  timezone: z.string().max(50).optional(),
  meetingUrl: z.string().url().optional(),
  meetingProvider: z.enum(["zoom", "teams", "meet", "other"]).optional(),
});

const updateSessionSchema = z.object({
  title: z.string().max(255).optional(),
  type: z.enum(["coaching", "one_on_one", "check_in", "review", "planning"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  status: z.enum(["scheduled", "prep_in_progress", "ready", "completed", "cancelled", "no_show"]).optional(),
  meetingUrl: z.string().url().optional(),
  meetingProvider: z.enum(["zoom", "teams", "meet", "other"]).optional(),
});

const createPrepSchema = z.object({
  progressSummary: z.string().optional(),
  wins: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  topicsToDiscuss: z.array(z.string()).optional(),
  reflections: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  goalsOnTrack: z.number().int().min(0).optional(),
  goalsAtRisk: z.number().int().min(0).optional(),
  isComplete: z.boolean().optional(),
});

const createNoteSchema = z.object({
  content: z.string().min(1),
  isPrivate: z.boolean().default(false),
});

const createActionItemSchema = z.object({
  sessionId: z.string().uuid().optional(),
  ownerId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  goalId: z.string().uuid().optional(),
});

const updateActionItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const sessionQuerySchema = listQuerySchema.extend({
  status: z.enum(["upcoming", "past", "all"]).default("all"),
  coachId: z.string().uuid().optional(),
  coacheeId: z.string().uuid().optional(),
});

const actionItemQuerySchema = listQuerySchema.extend({
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled", "all"]).default("all"),
  ownerId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

// ============================================================================
// COACHING RELATIONSHIPS
// ============================================================================

/**
 * GET /tenants/:tenantId/coaching/relationships
 * List coaching relationships for current user
 */
coachingRouter.get(
  "/relationships",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const query = c.req.valid("query");

    const relationships = await db.query.coachingRelationships.findMany({
      where: and(
        eq(coachingRelationships.tenantId, tenantCtx.id),
        or(
          eq(coachingRelationships.coachId, user.id),
          eq(coachingRelationships.coacheeId, user.id)
        )
      ),
      with: {
        coach: true,
        coachee: true,
      },
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
      orderBy: (rel, { desc }) => [desc(rel.createdAt)],
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coachingRelationships)
      .where(
        and(
          eq(coachingRelationships.tenantId, tenantCtx.id),
          or(
            eq(coachingRelationships.coachId, user.id),
            eq(coachingRelationships.coacheeId, user.id)
          )
        )
      );

    return paginated(
      c,
      relationships.map((r) => ({
        id: r.id,
        relationshipType: r.relationshipType,
        isActive: r.isActive,
        defaultDurationMinutes: r.defaultDurationMinutes,
        preferredDay: r.preferredDay,
        preferredTime: r.preferredTime,
        meetingFrequency: r.meetingFrequency,
        coach: {
          id: r.coach.id,
          email: r.coach.email,
          firstName: r.coach.firstName,
          lastName: r.coach.lastName,
          avatarUrl: r.coach.avatarUrl,
        },
        coachee: {
          id: r.coachee.id,
          email: r.coachee.email,
          firstName: r.coachee.firstName,
          lastName: r.coachee.lastName,
          avatarUrl: r.coachee.avatarUrl,
        },
        isCoach: r.coachId === user.id,
        createdAt: r.createdAt,
      })),
      {
        page: query.page,
        perPage: query.perPage,
        total: Number(count),
      }
    );
  }
);

/**
 * POST /tenants/:tenantId/coaching/relationships
 * Create a coaching relationship (admin only)
 */
coachingRouter.post(
  "/relationships",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", createRelationshipSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const body = c.req.valid("json");

    // Check if relationship already exists
    const existing = await db.query.coachingRelationships.findFirst({
      where: and(
        eq(coachingRelationships.tenantId, tenantCtx.id),
        eq(coachingRelationships.coachId, body.coachId),
        eq(coachingRelationships.coacheeId, body.coacheeId)
      ),
    });

    if (existing) {
      throw new HTTPException(409, {
        message: "Coaching relationship already exists",
      });
    }

    const [relationship] = await db
      .insert(coachingRelationships)
      .values({
        tenantId: tenantCtx.id,
        ...body,
      })
      .returning();

    // Create history record
    await db.insert(coachingHistory).values({
      relationshipId: relationship.id,
    });

    return success(c, relationship, 201);
  }
);

/**
 * GET /tenants/:tenantId/coaching/relationships/:relationshipId
 * Get relationship details
 */
coachingRouter.get(
  "/relationships/:relationshipId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const relationshipId = c.req.param("relationshipId");

    const relationship = await db.query.coachingRelationships.findFirst({
      where: and(
        eq(coachingRelationships.id, relationshipId),
        eq(coachingRelationships.tenantId, tenantCtx.id)
      ),
      with: {
        coach: true,
        coachee: true,
        history: true,
      },
    });

    if (!relationship) {
      throw new HTTPException(404, { message: "Relationship not found" });
    }

    return success(c, {
      ...relationship,
      coach: {
        id: relationship.coach.id,
        email: relationship.coach.email,
        firstName: relationship.coach.firstName,
        lastName: relationship.coach.lastName,
        avatarUrl: relationship.coach.avatarUrl,
      },
      coachee: {
        id: relationship.coachee.id,
        email: relationship.coachee.email,
        firstName: relationship.coachee.firstName,
        lastName: relationship.coachee.lastName,
        avatarUrl: relationship.coachee.avatarUrl,
      },
    });
  }
);

/**
 * PATCH /tenants/:tenantId/coaching/relationships/:relationshipId
 * Update relationship
 */
coachingRouter.patch(
  "/relationships/:relationshipId",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", updateRelationshipSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const relationshipId = c.req.param("relationshipId");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(coachingRelationships)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coachingRelationships.id, relationshipId),
          eq(coachingRelationships.tenantId, tenantCtx.id)
        )
      )
      .returning();

    if (!updated) {
      throw new HTTPException(404, { message: "Relationship not found" });
    }

    return success(c, updated);
  }
);

/**
 * DELETE /tenants/:tenantId/coaching/relationships/:relationshipId
 * Deactivate relationship
 */
coachingRouter.delete(
  "/relationships/:relationshipId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const relationshipId = c.req.param("relationshipId");

    await db
      .update(coachingRelationships)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coachingRelationships.id, relationshipId),
          eq(coachingRelationships.tenantId, tenantCtx.id)
        )
      );

    return noContent(c);
  }
);

// ============================================================================
// COACHING SESSIONS
// ============================================================================

/**
 * GET /tenants/:tenantId/coaching/sessions
 * List sessions for current user
 */
coachingRouter.get(
  "/sessions",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", sessionQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const query = c.req.valid("query");

    const now = new Date();
    const conditions = [
      eq(coachingSessions.tenantId, tenantCtx.id),
      or(
        eq(coachingSessions.coachId, user.id),
        eq(coachingSessions.coacheeId, user.id)
      ),
    ];

    if (query.status === "upcoming") {
      conditions.push(gt(coachingSessions.scheduledAt, now));
    } else if (query.status === "past") {
      conditions.push(lt(coachingSessions.scheduledAt, now));
    }

    if (query.coachId) {
      conditions.push(eq(coachingSessions.coachId, query.coachId));
    }
    if (query.coacheeId) {
      conditions.push(eq(coachingSessions.coacheeId, query.coacheeId));
    }

    const sessions = await db.query.coachingSessions.findMany({
      where: and(...conditions),
      with: {
        coach: true,
        coachee: true,
      },
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
      orderBy: (sessions, { asc, desc }) => [
        query.status === "past" ? desc(sessions.scheduledAt) : asc(sessions.scheduledAt),
      ],
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coachingSessions)
      .where(and(...conditions));

    return paginated(
      c,
      sessions.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        scheduledAt: s.scheduledAt,
        durationMinutes: s.durationMinutes,
        status: s.status,
        prepStatus: s.prepStatus,
        meetingUrl: s.meetingUrl,
        meetingProvider: s.meetingProvider,
        coach: {
          id: s.coach.id,
          email: s.coach.email,
          firstName: s.coach.firstName,
          lastName: s.coach.lastName,
          avatarUrl: s.coach.avatarUrl,
        },
        coachee: {
          id: s.coachee.id,
          email: s.coachee.email,
          firstName: s.coachee.firstName,
          lastName: s.coachee.lastName,
          avatarUrl: s.coachee.avatarUrl,
        },
        isCoach: s.coachId === user.id,
        createdAt: s.createdAt,
      })),
      {
        page: query.page,
        perPage: query.perPage,
        total: Number(count),
      }
    );
  }
);

/**
 * POST /tenants/:tenantId/coaching/sessions
 * Schedule a new session
 */
coachingRouter.post(
  "/sessions",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createSessionSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const body = c.req.valid("json");

    const [session] = await db
      .insert(coachingSessions)
      .values({
        tenantId: tenantCtx.id,
        ...body,
        scheduledAt: new Date(body.scheduledAt),
      })
      .returning();

    // Update relationship history if exists
    if (body.relationshipId) {
      await db
        .update(coachingHistory)
        .set({
          totalSessions: sql`total_sessions + 1`,
          nextSessionAt: new Date(body.scheduledAt),
          updatedAt: new Date(),
        })
        .where(eq(coachingHistory.relationshipId, body.relationshipId));
    }

    return success(c, session, 201);
  }
);

/**
 * GET /tenants/:tenantId/coaching/sessions/:sessionId
 * Get session details with prep, notes, and action items
 */
coachingRouter.get(
  "/sessions/:sessionId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const sessionId = c.req.param("sessionId");

    const session = await db.query.coachingSessions.findFirst({
      where: and(
        eq(coachingSessions.id, sessionId),
        eq(coachingSessions.tenantId, tenantCtx.id)
      ),
      with: {
        coach: true,
        coachee: true,
        prep: true,
        notes: {
          with: {
            author: true,
          },
          orderBy: (notes, { desc }) => [desc(notes.createdAt)],
        },
        actionItems: {
          with: {
            owner: true,
          },
          orderBy: (items, { asc }) => [asc(items.createdAt)],
        },
      },
    });

    if (!session) {
      throw new HTTPException(404, { message: "Session not found" });
    }

    return success(c, {
      ...session,
      coach: {
        id: session.coach.id,
        email: session.coach.email,
        firstName: session.coach.firstName,
        lastName: session.coach.lastName,
        avatarUrl: session.coach.avatarUrl,
      },
      coachee: {
        id: session.coachee.id,
        email: session.coachee.email,
        firstName: session.coachee.firstName,
        lastName: session.coachee.lastName,
        avatarUrl: session.coachee.avatarUrl,
      },
      notes: session.notes.map((n) => ({
        id: n.id,
        content: n.content,
        isPrivate: n.isPrivate,
        createdAt: n.createdAt,
        author: {
          id: n.author.id,
          firstName: n.author.firstName,
          lastName: n.author.lastName,
          avatarUrl: n.author.avatarUrl,
        },
      })),
      actionItems: session.actionItems.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        priority: a.priority,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        owner: {
          id: a.owner.id,
          firstName: a.owner.firstName,
          lastName: a.owner.lastName,
          avatarUrl: a.owner.avatarUrl,
        },
      })),
    });
  }
);

/**
 * PATCH /tenants/:tenantId/coaching/sessions/:sessionId
 * Update session
 */
coachingRouter.patch(
  "/sessions/:sessionId",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", updateSessionSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const sessionId = c.req.param("sessionId");
    const body = c.req.valid("json");

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt);
    }

    if (body.status === "completed") {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(coachingSessions)
      .set(updateData)
      .where(
        and(
          eq(coachingSessions.id, sessionId),
          eq(coachingSessions.tenantId, tenantCtx.id)
        )
      )
      .returning();

    if (!updated) {
      throw new HTTPException(404, { message: "Session not found" });
    }

    // Update history if completing
    if (body.status === "completed" && updated.relationshipId) {
      await db
        .update(coachingHistory)
        .set({
          completedSessions: sql`completed_sessions + 1`,
          lastSessionAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(coachingHistory.relationshipId, updated.relationshipId));
    }

    return success(c, updated);
  }
);

/**
 * DELETE /tenants/:tenantId/coaching/sessions/:sessionId
 * Cancel session
 */
coachingRouter.delete(
  "/sessions/:sessionId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const sessionId = c.req.param("sessionId");

    await db
      .update(coachingSessions)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coachingSessions.id, sessionId),
          eq(coachingSessions.tenantId, tenantCtx.id)
        )
      );

    return noContent(c);
  }
);

// ============================================================================
// SESSION PREP
// ============================================================================

/**
 * GET /tenants/:tenantId/coaching/sessions/:sessionId/prep
 * Get session prep
 */
coachingRouter.get(
  "/sessions/:sessionId/prep",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const user = c.get("user");

    const prep = await db.query.sessionPrep.findFirst({
      where: and(
        eq(sessionPrep.sessionId, sessionId),
        eq(sessionPrep.userId, user.id)
      ),
    });

    return success(c, prep || null);
  }
);

/**
 * POST /tenants/:tenantId/coaching/sessions/:sessionId/prep
 * Create or update session prep
 */
coachingRouter.post(
  "/sessions/:sessionId/prep",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createPrepSchema),
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const user = c.get("user");
    const body = c.req.valid("json");

    // Check if prep already exists
    const existing = await db.query.sessionPrep.findFirst({
      where: and(
        eq(sessionPrep.sessionId, sessionId),
        eq(sessionPrep.userId, user.id)
      ),
    });

    let prep;
    if (existing) {
      [prep] = await db
        .update(sessionPrep)
        .set({
          ...body,
          completedAt: body.isComplete ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(sessionPrep.id, existing.id))
        .returning();
    } else {
      [prep] = await db
        .insert(sessionPrep)
        .values({
          sessionId,
          userId: user.id,
          ...body,
          completedAt: body.isComplete ? new Date() : null,
        })
        .returning();
    }

    // Update session prep status
    await db
      .update(coachingSessions)
      .set({
        prepStatus: body.isComplete ? "ready" : "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(coachingSessions.id, sessionId));

    return success(c, prep, existing ? 200 : 201);
  }
);

// ============================================================================
// SESSION NOTES
// ============================================================================

/**
 * GET /tenants/:tenantId/coaching/sessions/:sessionId/notes
 * Get session notes
 */
coachingRouter.get(
  "/sessions/:sessionId/notes",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const user = c.get("user");

    const notes = await db.query.sessionNotes.findMany({
      where: and(
        eq(sessionNotes.sessionId, sessionId),
        or(
          eq(sessionNotes.isPrivate, false),
          eq(sessionNotes.authorId, user.id)
        )
      ),
      with: {
        author: true,
      },
      orderBy: (notes, { desc }) => [desc(notes.createdAt)],
    });

    return success(
      c,
      notes.map((n) => ({
        id: n.id,
        content: n.content,
        isPrivate: n.isPrivate,
        createdAt: n.createdAt,
        author: {
          id: n.author.id,
          firstName: n.author.firstName,
          lastName: n.author.lastName,
          avatarUrl: n.author.avatarUrl,
        },
      }))
    );
  }
);

/**
 * POST /tenants/:tenantId/coaching/sessions/:sessionId/notes
 * Add a note to session
 */
coachingRouter.post(
  "/sessions/:sessionId/notes",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createNoteSchema),
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [note] = await db
      .insert(sessionNotes)
      .values({
        sessionId,
        authorId: user.id,
        content: body.content,
        isPrivate: body.isPrivate,
      })
      .returning();

    return success(c, note, 201);
  }
);

// ============================================================================
// ACTION ITEMS
// ============================================================================

/**
 * GET /tenants/:tenantId/coaching/action-items
 * List action items
 */
coachingRouter.get(
  "/action-items",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", actionItemQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const query = c.req.valid("query");

    const conditions = [eq(coachingActionItems.tenantId, tenantCtx.id)];

    if (query.ownerId) {
      conditions.push(eq(coachingActionItems.ownerId, query.ownerId));
    } else {
      // Default to current user's action items
      conditions.push(eq(coachingActionItems.ownerId, user.id));
    }

    if (query.status !== "all") {
      conditions.push(eq(coachingActionItems.status, query.status));
    }

    if (query.sessionId) {
      conditions.push(eq(coachingActionItems.sessionId, query.sessionId));
    }

    const items = await db.query.coachingActionItems.findMany({
      where: and(...conditions),
      with: {
        owner: true,
        session: {
          with: {
            coach: true,
            coachee: true,
          },
        },
      },
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
      orderBy: (items, { asc, desc }) => [
        asc(items.status),
        asc(items.dueDate),
        desc(items.createdAt),
      ],
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coachingActionItems)
      .where(and(...conditions));

    return paginated(
      c,
      items.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        priority: a.priority,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        owner: {
          id: a.owner.id,
          firstName: a.owner.firstName,
          lastName: a.owner.lastName,
          avatarUrl: a.owner.avatarUrl,
        },
        session: a.session
          ? {
              id: a.session.id,
              title: a.session.title,
              scheduledAt: a.session.scheduledAt,
            }
          : null,
      })),
      {
        page: query.page,
        perPage: query.perPage,
        total: Number(count),
      }
    );
  }
);

/**
 * POST /tenants/:tenantId/coaching/action-items
 * Create action item
 */
coachingRouter.post(
  "/action-items",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createActionItemSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const body = c.req.valid("json");

    const [item] = await db
      .insert(coachingActionItems)
      .values({
        tenantId: tenantCtx.id,
        assignedById: user.id,
        ...body,
        dueDate: body.dueDate || null,
      })
      .returning();

    // Update history if session has relationship
    if (body.sessionId) {
      const session = await db.query.coachingSessions.findFirst({
        where: eq(coachingSessions.id, body.sessionId),
      });

      if (session?.relationshipId) {
        await db
          .update(coachingHistory)
          .set({
            totalActionItems: sql`total_action_items + 1`,
            updatedAt: new Date(),
          })
          .where(eq(coachingHistory.relationshipId, session.relationshipId));
      }
    }

    return success(c, item, 201);
  }
);

/**
 * PATCH /tenants/:tenantId/coaching/action-items/:actionItemId
 * Update action item
 */
coachingRouter.patch(
  "/action-items/:actionItemId",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", updateActionItemSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const actionItemId = c.req.param("actionItemId");
    const body = c.req.valid("json");

    // Get current item for history update
    const current = await db.query.coachingActionItems.findFirst({
      where: and(
        eq(coachingActionItems.id, actionItemId),
        eq(coachingActionItems.tenantId, tenantCtx.id)
      ),
      with: {
        session: true,
      },
    });

    if (!current) {
      throw new HTTPException(404, { message: "Action item not found" });
    }

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.status === "completed" && current.status !== "completed") {
      updateData.completedAt = new Date();

      // Update history if session has relationship
      if (current.session?.relationshipId) {
        await db
          .update(coachingHistory)
          .set({
            completedActionItems: sql`completed_action_items + 1`,
            actionItemCompletionRate: sql`
              CASE
                WHEN total_action_items > 0
                THEN ((completed_action_items + 1) * 100 / total_action_items)
                ELSE 0
              END
            `,
            updatedAt: new Date(),
          })
          .where(eq(coachingHistory.relationshipId, current.session.relationshipId));
      }
    }

    const [updated] = await db
      .update(coachingActionItems)
      .set(updateData)
      .where(
        and(
          eq(coachingActionItems.id, actionItemId),
          eq(coachingActionItems.tenantId, tenantCtx.id)
        )
      )
      .returning();

    return success(c, updated);
  }
);

/**
 * DELETE /tenants/:tenantId/coaching/action-items/:actionItemId
 * Delete action item
 */
coachingRouter.delete(
  "/action-items/:actionItemId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const actionItemId = c.req.param("actionItemId");

    await db
      .delete(coachingActionItems)
      .where(
        and(
          eq(coachingActionItems.id, actionItemId),
          eq(coachingActionItems.tenantId, tenantCtx.id)
        )
      );

    return noContent(c);
  }
);

// ============================================================================
// STATS
// ============================================================================

/**
 * GET /tenants/:tenantId/coaching/stats
 * Get coaching dashboard stats for current user
 */
coachingRouter.get(
  "/stats",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const now = new Date();

    // Count upcoming sessions
    const [{ upcomingSessions }] = await db
      .select({ upcomingSessions: sql<number>`count(*)` })
      .from(coachingSessions)
      .where(
        and(
          eq(coachingSessions.tenantId, tenantCtx.id),
          or(
            eq(coachingSessions.coachId, user.id),
            eq(coachingSessions.coacheeId, user.id)
          ),
          gt(coachingSessions.scheduledAt, now)
        )
      );

    // Count active relationships
    const [{ activeRelationships }] = await db
      .select({ activeRelationships: sql<number>`count(*)` })
      .from(coachingRelationships)
      .where(
        and(
          eq(coachingRelationships.tenantId, tenantCtx.id),
          eq(coachingRelationships.isActive, true),
          or(
            eq(coachingRelationships.coachId, user.id),
            eq(coachingRelationships.coacheeId, user.id)
          )
        )
      );

    // Count pending action items
    const [{ pendingActionItems }] = await db
      .select({ pendingActionItems: sql<number>`count(*)` })
      .from(coachingActionItems)
      .where(
        and(
          eq(coachingActionItems.tenantId, tenantCtx.id),
          eq(coachingActionItems.ownerId, user.id),
          eq(coachingActionItems.status, "pending")
        )
      );

    // Count completed sessions this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [{ completedThisMonth }] = await db
      .select({ completedThisMonth: sql<number>`count(*)` })
      .from(coachingSessions)
      .where(
        and(
          eq(coachingSessions.tenantId, tenantCtx.id),
          or(
            eq(coachingSessions.coachId, user.id),
            eq(coachingSessions.coacheeId, user.id)
          ),
          eq(coachingSessions.status, "completed"),
          gt(coachingSessions.completedAt, monthStart)
        )
      );

    return success(c, {
      upcomingSessions: Number(upcomingSessions),
      activeRelationships: Number(activeRelationships),
      pendingActionItems: Number(pendingActionItems),
      completedThisMonth: Number(completedThisMonth),
    });
  }
);

export { coachingRouter };
