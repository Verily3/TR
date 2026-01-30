import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  db,
  eq,
  and,
  sql,
  goals,
  goalMilestones,
  goalUpdates,
  scorecards,
} from "@tr/db";
import { success, paginated, noContent } from "../lib/response";
import { listQuerySchema } from "../lib/validation";
import { authMiddleware, tenantMiddleware } from "../middleware";
import type { AppVariables } from "../types";

const goalsRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const createGoalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(["performance", "development", "project", "okr"]).default("performance"),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
  scorecardId: z.string().uuid().optional(),
  parentGoalId: z.string().uuid().optional(),
  metrics: z.record(z.unknown()).optional(),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(["not_started", "in_progress", "completed", "on_hold", "cancelled"]).optional(),
  progressStatus: z.enum(["on_track", "at_risk", "behind", "ahead"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  targetDate: z.string().datetime().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

const createUpdateSchema = z.object({
  content: z.string().min(1),
  progressChange: z.number().int().optional(),
  newProgress: z.number().int().min(0).max(100).optional(),
  statusChange: z.enum(["on_track", "at_risk", "behind", "ahead"]).optional(),
});

// ============================================================================
// GOALS CRUD
// ============================================================================

/**
 * GET /tenants/:tenantId/goals
 * List goals (user's own goals or all if admin)
 */
goalsRouter.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema.extend({
    userId: z.string().uuid().optional(),
    status: z.enum(["not_started", "in_progress", "completed", "on_hold", "cancelled"]).optional(),
    type: z.enum(["performance", "development", "project", "okr"]).optional(),
  })),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const query = c.req.valid("query");

    // Build where conditions
    const conditions = [eq(goals.tenantId, tenantCtx.id)];

    // If not admin, only show own goals or goals assigned to them
    if (tenantCtx.role !== "admin" && !query.userId) {
      conditions.push(eq(goals.ownerId, user.id));
    } else if (query.userId) {
      conditions.push(eq(goals.ownerId, query.userId));
    }

    if (query.status) {
      conditions.push(eq(goals.status, query.status));
    }

    if (query.type) {
      conditions.push(eq(goals.type, query.type));
    }

    const goalList = await db.query.goals.findMany({
      where: and(...conditions),
      with: {
        owner: true,
        milestones: true,
      },
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
      orderBy: (goals, { desc }) => [desc(goals.createdAt)],
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(goals)
      .where(and(...conditions));

    return paginated(
      c,
      goalList.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        type: g.type,
        status: g.status,
        progressStatus: g.progressStatus,
        progress: g.progress,
        targetDate: g.targetDate,
        owner: {
          id: g.owner.id,
          firstName: g.owner.firstName,
          lastName: g.owner.lastName,
        },
        milestoneCount: g.milestones.length,
        completedMilestones: g.milestones.filter((m) => m.isCompleted).length,
        createdAt: g.createdAt,
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
 * POST /tenants/:tenantId/goals
 * Create a new goal
 */
goalsRouter.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createGoalSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const body = c.req.valid("json");

    const [goal] = await db
      .insert(goals)
      .values({
        tenantId: tenantCtx.id,
        ownerId: user.id,
        createdById: user.id,
        title: body.title,
        description: body.description,
        type: body.type,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        scorecardId: body.scorecardId,
        parentGoalId: body.parentGoalId,
        metrics: body.metrics,
      })
      .returning();

    return success(c, goal, 201);
  }
);

/**
 * GET /tenants/:tenantId/goals/:goalId
 * Get goal details with milestones and updates
 */
goalsRouter.get(
  "/:goalId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const goalId = c.req.param("goalId");

    const goal = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.tenantId, tenantCtx.id)),
      with: {
        owner: true,
        createdBy: true,
        milestones: {
          orderBy: (milestones, { asc }) => [asc(milestones.orderIndex)],
        },
        updates: {
          orderBy: (updates, { desc }) => [desc(updates.createdAt)],
          limit: 10,
          with: {
            author: true,
          },
        },
      },
    });

    if (!goal) {
      throw new HTTPException(404, { message: "Goal not found" });
    }

    return success(c, goal);
  }
);

/**
 * PATCH /tenants/:tenantId/goals/:goalId
 * Update a goal
 */
goalsRouter.patch(
  "/:goalId",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", updateGoalSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const goalId = c.req.param("goalId");
    const body = c.req.valid("json");

    // Check ownership or admin
    const existing = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.tenantId, tenantCtx.id)),
    });

    if (!existing) {
      throw new HTTPException(404, { message: "Goal not found" });
    }

    if (existing.ownerId !== user.id && tenantCtx.role !== "admin") {
      throw new HTTPException(403, {
        message: "You can only update your own goals",
      });
    }

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.startDate) {
      updateData.startDate = new Date(body.startDate);
    }
    if (body.targetDate) {
      updateData.targetDate = new Date(body.targetDate);
    }

    const [updated] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, goalId))
      .returning();

    return success(c, updated);
  }
);

/**
 * DELETE /tenants/:tenantId/goals/:goalId
 * Delete a goal
 */
goalsRouter.delete(
  "/:goalId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const goalId = c.req.param("goalId");

    // Check ownership or admin
    const existing = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.tenantId, tenantCtx.id)),
    });

    if (!existing) {
      throw new HTTPException(404, { message: "Goal not found" });
    }

    if (existing.ownerId !== user.id && tenantCtx.role !== "admin") {
      throw new HTTPException(403, {
        message: "You can only delete your own goals",
      });
    }

    await db.delete(goals).where(eq(goals.id, goalId));

    return noContent(c);
  }
);

// ============================================================================
// MILESTONES
// ============================================================================

/**
 * POST /tenants/:tenantId/goals/:goalId/milestones
 * Add milestone to goal
 */
goalsRouter.post(
  "/:goalId/milestones",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createMilestoneSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const goalId = c.req.param("goalId");
    const body = c.req.valid("json");

    // Check ownership or admin
    const goal = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.tenantId, tenantCtx.id)),
    });

    if (!goal) {
      throw new HTTPException(404, { message: "Goal not found" });
    }

    if (goal.ownerId !== user.id && tenantCtx.role !== "admin") {
      throw new HTTPException(403, { message: "Access denied" });
    }

    // Get next order index
    let orderIndex = body.orderIndex;
    if (orderIndex === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(order_index), -1)` })
        .from(goalMilestones)
        .where(eq(goalMilestones.goalId, goalId));
      orderIndex = Number(maxOrder) + 1;
    }

    const [milestone] = await db
      .insert(goalMilestones)
      .values({
        goalId,
        title: body.title,
        description: body.description,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        orderIndex,
      })
      .returning();

    return success(c, milestone, 201);
  }
);

/**
 * PATCH /tenants/:tenantId/goals/:goalId/milestones/:milestoneId/complete
 * Mark milestone as complete
 */
goalsRouter.patch(
  "/:goalId/milestones/:milestoneId/complete",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const goalId = c.req.param("goalId");
    const milestoneId = c.req.param("milestoneId");

    // Check ownership
    const goal = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.tenantId, tenantCtx.id)),
    });

    if (!goal) {
      throw new HTTPException(404, { message: "Goal not found" });
    }

    if (goal.ownerId !== user.id && tenantCtx.role !== "admin") {
      throw new HTTPException(403, { message: "Access denied" });
    }

    const [milestone] = await db
      .update(goalMilestones)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(goalMilestones.id, milestoneId),
          eq(goalMilestones.goalId, goalId)
        )
      )
      .returning();

    if (!milestone) {
      throw new HTTPException(404, { message: "Milestone not found" });
    }

    return success(c, milestone);
  }
);

// ============================================================================
// UPDATES
// ============================================================================

/**
 * POST /tenants/:tenantId/goals/:goalId/updates
 * Add progress update to goal
 */
goalsRouter.post(
  "/:goalId/updates",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createUpdateSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const goalId = c.req.param("goalId");
    const body = c.req.valid("json");

    // Check goal exists
    const goal = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.tenantId, tenantCtx.id)),
    });

    if (!goal) {
      throw new HTTPException(404, { message: "Goal not found" });
    }

    // Create update
    const [update] = await db
      .insert(goalUpdates)
      .values({
        goalId,
        authorId: user.id,
        content: body.content,
        previousProgress: goal.progress,
        newProgress: body.newProgress,
        progressChange: body.progressChange,
        statusChange: body.statusChange,
      })
      .returning();

    // Update goal progress if provided
    if (body.newProgress !== undefined || body.statusChange) {
      const goalUpdateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (body.newProgress !== undefined) {
        goalUpdateData.progress = body.newProgress;
      }
      if (body.statusChange) {
        goalUpdateData.progressStatus = body.statusChange;
      }
      await db.update(goals).set(goalUpdateData).where(eq(goals.id, goalId));
    }

    return success(c, update, 201);
  }
);

export { goalsRouter };
