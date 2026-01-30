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
  inArray,
  assessments,
  assessmentTemplates,
  assessmentInvitations,
  assessmentResponses,
  assessmentResults,
  assessmentGoalSuggestions,
  users,
  goals,
} from "@tr/db";
import { success, paginated, noContent } from "../lib/response";
import { listQuerySchema } from "../lib/validation";
import {
  authMiddleware,
  tenantMiddleware,
} from "../middleware";
import type { AppVariables } from "../types";

const assessmentsRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const createAssessmentSchema = z.object({
  templateId: z.string().uuid().optional(),
  subjectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["180", "360", "self", "custom"]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  anonymizeResponses: z.boolean().default(true),
});

const updateAssessmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["draft", "active", "closed", "archived"]).optional(),
  anonymizeResponses: z.boolean().optional(),
});

const addInvitationsSchema = z.object({
  raters: z.array(z.object({
    raterId: z.string().uuid().optional(),
    raterEmail: z.string().email(),
    raterName: z.string().optional(),
    raterType: z.enum(["self", "manager", "peer", "direct_report", "external"]),
  })).min(1),
});

const assessmentListQuerySchema = listQuerySchema.extend({
  status: z.enum(["draft", "active", "closed", "archived", "all"]).default("all"),
  type: z.enum(["180", "360", "self", "custom", "all"]).default("all"),
  subjectId: z.string().uuid().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateToken(): string {
  return crypto.randomUUID();
}

async function aggregateResults(assessmentId: string) {
  // Get the assessment with template
  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, assessmentId),
    with: {
      template: true,
    },
  });

  if (!assessment || !assessment.template) return;

  const competencies = (assessment.template.competencies as any[]) || [];

  // Get all completed invitations with responses
  const invitations = await db.query.assessmentInvitations.findMany({
    where: and(
      eq(assessmentInvitations.assessmentId, assessmentId),
      eq(assessmentInvitations.status, "completed")
    ),
    with: {
      responses: true,
    },
  });

  // Delete existing results
  await db.delete(assessmentResults).where(eq(assessmentResults.assessmentId, assessmentId));

  // Aggregate by competency
  for (const competency of competencies) {
    const competencyId = competency.id;
    const competencyName = competency.name;

    // Collect scores by rater type
    const scoresByType: Record<string, number[]> = {
      self: [],
      manager: [],
      peer: [],
      direct_report: [],
    };

    for (const invitation of invitations) {
      const raterType = invitation.raterType;
      const responses = invitation.responses.filter(r => r.competencyId === competencyId);

      if (responses.length > 0) {
        const avgScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length;
        if (scoresByType[raterType]) {
          scoresByType[raterType].push(avgScore);
        }
      }
    }

    // Calculate averages
    const calcAvg = (scores: number[]) => scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    const selfScore = calcAvg(scoresByType.self);
    const managerScore = calcAvg(scoresByType.manager);
    const peerScore = calcAvg(scoresByType.peer);
    const directReportScore = calcAvg(scoresByType.direct_report);

    // Calculate overall (all raters)
    const allScores = Object.values(scoresByType).flat();
    const overallScore = calcAvg(allScores);

    // Calculate gap (self vs others)
    const othersScores = [...scoresByType.manager, ...scoresByType.peer, ...scoresByType.direct_report];
    const othersAvg = calcAvg(othersScores);
    const selfVsOthersGap = selfScore !== null && othersAvg !== null
      ? selfScore - othersAvg
      : null;

    // Insert result
    await db.insert(assessmentResults).values({
      assessmentId,
      competencyId,
      competencyName,
      selfScore: selfScore?.toFixed(2),
      managerScore: managerScore?.toFixed(2),
      peerScore: peerScore?.toFixed(2),
      directReportScore: directReportScore?.toFixed(2),
      overallScore: overallScore?.toFixed(2),
      selfCount: scoresByType.self.length,
      managerCount: scoresByType.manager.length,
      peerCount: scoresByType.peer.length,
      directReportCount: scoresByType.direct_report.length,
      selfVsOthersGap: selfVsOthersGap?.toFixed(2),
    });
  }
}

// ============================================================================
// STATS
// ============================================================================

/**
 * GET /tenants/:tenantId/assessments/stats
 * Dashboard stats
 */
assessmentsRouter.get(
  "/stats",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");

    // Count active assessments where user is subject or created by user
    const activeAssessments = await db.select({ count: sql<number>`count(*)` })
      .from(assessments)
      .where(and(
        eq(assessments.tenantId, tenantCtx.id),
        eq(assessments.status, "active")
      ));

    // Count pending responses for current user
    const pendingInvitations = await db.select({ count: sql<number>`count(*)` })
      .from(assessmentInvitations)
      .innerJoin(assessments, eq(assessmentInvitations.assessmentId, assessments.id))
      .where(and(
        eq(assessments.tenantId, tenantCtx.id),
        eq(assessmentInvitations.raterId, user.id),
        inArray(assessmentInvitations.status, ["pending", "started"])
      ));

    // Count completed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completedThisMonth = await db.select({ count: sql<number>`count(*)` })
      .from(assessments)
      .where(and(
        eq(assessments.tenantId, tenantCtx.id),
        eq(assessments.status, "closed"),
        sql`${assessments.updatedAt} >= ${startOfMonth.toISOString()}`
      ));

    // Calculate average completion rate
    const allActiveAssessments = await db.select({
      total: sql<number>`sum(${assessments.totalInvitations})`,
      completed: sql<number>`sum(${assessments.completedResponses})`,
    })
      .from(assessments)
      .where(and(
        eq(assessments.tenantId, tenantCtx.id),
        inArray(assessments.status, ["active", "closed"])
      ));

    const total = Number(allActiveAssessments[0]?.total) || 0;
    const completed = Number(allActiveAssessments[0]?.completed) || 0;
    const avgCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return success(c, {
      activeAssessments: Number(activeAssessments[0]?.count) || 0,
      pendingResponses: Number(pendingInvitations[0]?.count) || 0,
      completedThisMonth: Number(completedThisMonth[0]?.count) || 0,
      avgCompletionRate,
    });
  }
);

// ============================================================================
// MY ASSESSMENTS
// ============================================================================

/**
 * GET /tenants/:tenantId/assessments/mine
 * Assessments where current user is the subject
 */
assessmentsRouter.get(
  "/mine",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const query = c.req.valid("query");
    const offset = (query.page - 1) * query.perPage;

    const results = await db.query.assessments.findMany({
      where: and(
        eq(assessments.tenantId, tenantCtx.id),
        eq(assessments.subjectId, user.id)
      ),
      with: {
        template: {
          columns: { id: true, name: true },
        },
        subject: {
          columns: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: query.perPage,
      offset,
    });

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(assessments)
      .where(and(
        eq(assessments.tenantId, tenantCtx.id),
        eq(assessments.subjectId, user.id)
      ));

    return paginated(c, results, {
      page: query.page,
      perPage: query.perPage,
      total: Number(countResult[0]?.count) || 0,
    });
  }
);

/**
 * GET /tenants/:tenantId/assessments/pending
 * Assessments where current user needs to respond as rater
 */
assessmentsRouter.get(
  "/pending",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const query = c.req.valid("query");
    const offset = (query.page - 1) * query.perPage;

    const invitations = await db.query.assessmentInvitations.findMany({
      where: and(
        eq(assessmentInvitations.raterId, user.id),
        inArray(assessmentInvitations.status, ["pending", "started"])
      ),
      with: {
        assessment: {
          with: {
            subject: {
              columns: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: (inv, { asc }) => [asc(inv.createdAt)],
      limit: query.perPage,
      offset,
    });

    // Filter to only include assessments from current tenant
    const filtered = invitations.filter(inv => inv.assessment.tenantId === tenantCtx.id);

    return paginated(c, filtered.map(inv => ({
      invitation: {
        id: inv.id,
        status: inv.status,
        raterType: inv.raterType,
        token: inv.token,
      },
      assessment: {
        id: inv.assessment.id,
        name: inv.assessment.name,
        type: inv.assessment.type,
        endDate: inv.assessment.endDate,
        subject: inv.assessment.subject,
      },
    })), {
      page: query.page,
      perPage: query.perPage,
      total: filtered.length,
    });
  }
);

// ============================================================================
// ASSESSMENTS CRUD
// ============================================================================

/**
 * GET /tenants/:tenantId/assessments
 * List assessments
 */
assessmentsRouter.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", assessmentListQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const query = c.req.valid("query");
    const offset = (query.page - 1) * query.perPage;

    const conditions = [eq(assessments.tenantId, tenantCtx.id)];

    if (query.status !== "all") {
      conditions.push(eq(assessments.status, query.status));
    }
    if (query.type !== "all") {
      conditions.push(eq(assessments.type, query.type));
    }
    if (query.subjectId) {
      conditions.push(eq(assessments.subjectId, query.subjectId));
    }

    const results = await db.query.assessments.findMany({
      where: and(...conditions),
      with: {
        template: {
          columns: { id: true, name: true },
        },
        subject: {
          columns: { id: true, email: true, firstName: true, lastName: true },
        },
        createdBy: {
          columns: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: query.perPage,
      offset,
    });

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(assessments)
      .where(and(...conditions));

    return paginated(c, results, {
      page: query.page,
      perPage: query.perPage,
      total: Number(countResult[0]?.count) || 0,
    });
  }
);

/**
 * POST /tenants/:tenantId/assessments
 * Create assessment
 */
assessmentsRouter.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", createAssessmentSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const data = c.req.valid("json");

    // Verify subject exists
    const subject = await db.query.users.findFirst({
      where: eq(users.id, data.subjectId),
    });
    if (!subject) {
      throw new HTTPException(404, { message: "Subject user not found" });
    }

    // Verify template if provided
    if (data.templateId) {
      const template = await db.query.assessmentTemplates.findFirst({
        where: eq(assessmentTemplates.id, data.templateId),
      });
      if (!template) {
        throw new HTTPException(404, { message: "Assessment template not found" });
      }
    }

    const [assessment] = await db.insert(assessments).values({
      tenantId: tenantCtx.id,
      templateId: data.templateId,
      subjectId: data.subjectId,
      name: data.name,
      description: data.description,
      type: data.type,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      anonymizeResponses: data.anonymizeResponses,
      status: "draft",
      createdById: user.id,
    }).returning();

    return success(c, assessment, 201);
  }
);

/**
 * GET /tenants/:tenantId/assessments/:assessmentId
 * Get assessment details
 */
assessmentsRouter.get(
  "/:assessmentId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
      with: {
        template: true,
        subject: {
          columns: { id: true, email: true, firstName: true, lastName: true },
        },
        createdBy: {
          columns: { id: true, email: true, firstName: true, lastName: true },
        },
        invitations: {
          with: {
            rater: {
              columns: { id: true, email: true, firstName: true, lastName: true },
            },
          },
          orderBy: (inv, { asc }) => [asc(inv.raterType)],
        },
        results: {
          orderBy: (res, { asc }) => [asc(res.competencyName)],
        },
        goalSuggestions: {
          orderBy: (sug, { desc }) => [desc(sug.createdAt)],
        },
      },
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    return success(c, assessment);
  }
);

/**
 * PATCH /tenants/:tenantId/assessments/:assessmentId
 * Update assessment
 */
assessmentsRouter.patch(
  "/:assessmentId",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", updateAssessmentSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");
    const data = c.req.valid("json");

    const existing = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!existing) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.anonymizeResponses !== undefined) updateData.anonymizeResponses = data.anonymizeResponses;

    const [updated] = await db.update(assessments)
      .set(updateData)
      .where(eq(assessments.id, assessmentId))
      .returning();

    return success(c, updated);
  }
);

/**
 * DELETE /tenants/:tenantId/assessments/:assessmentId
 * Archive assessment
 */
assessmentsRouter.delete(
  "/:assessmentId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    const existing = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!existing) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    await db.update(assessments)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(assessments.id, assessmentId));

    return noContent(c);
  }
);

// ============================================================================
// LIFECYCLE
// ============================================================================

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/launch
 * Launch assessment (set to active)
 */
assessmentsRouter.post(
  "/:assessmentId/launch",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
      with: {
        invitations: true,
      },
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    if (assessment.status !== "draft") {
      throw new HTTPException(400, { message: "Assessment must be in draft status to launch" });
    }

    if (assessment.invitations.length === 0) {
      throw new HTTPException(400, { message: "Assessment must have at least one rater to launch" });
    }

    const [updated] = await db.update(assessments)
      .set({
        status: "active",
        startDate: assessment.startDate || new Date(),
        updatedAt: new Date()
      })
      .where(eq(assessments.id, assessmentId))
      .returning();

    // TODO: Send invitation emails to all raters

    return success(c, updated);
  }
);

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/close
 * Close assessment
 */
assessmentsRouter.post(
  "/:assessmentId/close",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    if (assessment.status !== "active") {
      throw new HTTPException(400, { message: "Assessment must be active to close" });
    }

    // Aggregate results before closing
    await aggregateResults(assessmentId);

    const [updated] = await db.update(assessments)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(assessments.id, assessmentId))
      .returning();

    return success(c, updated);
  }
);

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/release
 * Release results to subject
 */
assessmentsRouter.post(
  "/:assessmentId/release",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    if (assessment.status !== "closed") {
      throw new HTTPException(400, { message: "Assessment must be closed before releasing results" });
    }

    const [updated] = await db.update(assessments)
      .set({ resultsReleasedAt: new Date(), updatedAt: new Date() })
      .where(eq(assessments.id, assessmentId))
      .returning();

    // TODO: Send notification to subject

    return success(c, updated);
  }
);

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * GET /tenants/:tenantId/assessments/:assessmentId/invitations
 * List invitations
 */
assessmentsRouter.get(
  "/:assessmentId/invitations",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    // Verify assessment belongs to tenant
    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const invitations = await db.query.assessmentInvitations.findMany({
      where: eq(assessmentInvitations.assessmentId, assessmentId),
      with: {
        rater: {
          columns: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: (inv, { asc }) => [asc(inv.raterType), asc(inv.createdAt)],
    });

    return success(c, invitations);
  }
);

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/invitations
 * Add raters
 */
assessmentsRouter.post(
  "/:assessmentId/invitations",
  authMiddleware,
  tenantMiddleware,
  zValidator("json", addInvitationsSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");
    const data = c.req.valid("json");

    // Verify assessment belongs to tenant
    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    if (assessment.status === "closed" || assessment.status === "archived") {
      throw new HTTPException(400, { message: "Cannot add raters to closed or archived assessment" });
    }

    const invitations = [];
    for (const rater of data.raters) {
      const token = generateToken();

      const [invitation] = await db.insert(assessmentInvitations).values({
        assessmentId,
        raterId: rater.raterId,
        raterEmail: rater.raterEmail,
        raterName: rater.raterName,
        raterType: rater.raterType,
        token,
        status: "pending",
      }).returning();

      invitations.push(invitation);
    }

    // Update total invitations count
    await db.update(assessments)
      .set({
        totalInvitations: sql`${assessments.totalInvitations} + ${invitations.length}`,
        updatedAt: new Date()
      })
      .where(eq(assessments.id, assessmentId));

    return success(c, invitations, 201);
  }
);

/**
 * DELETE /tenants/:tenantId/assessments/:assessmentId/invitations/:inviteId
 * Remove invitation
 */
assessmentsRouter.delete(
  "/:assessmentId/invitations/:inviteId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");
    const inviteId = c.req.param("inviteId");

    // Verify assessment belongs to tenant
    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const invitation = await db.query.assessmentInvitations.findFirst({
      where: and(
        eq(assessmentInvitations.id, inviteId),
        eq(assessmentInvitations.assessmentId, assessmentId)
      ),
    });

    if (!invitation) {
      throw new HTTPException(404, { message: "Invitation not found" });
    }

    if (invitation.status === "completed") {
      throw new HTTPException(400, { message: "Cannot remove completed invitation" });
    }

    await db.delete(assessmentInvitations).where(eq(assessmentInvitations.id, inviteId));

    // Update total invitations count
    await db.update(assessments)
      .set({
        totalInvitations: sql`${assessments.totalInvitations} - 1`,
        updatedAt: new Date()
      })
      .where(eq(assessments.id, assessmentId));

    return noContent(c);
  }
);

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/invitations/:inviteId/remind
 * Send reminder
 */
assessmentsRouter.post(
  "/:assessmentId/invitations/:inviteId/remind",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");
    const inviteId = c.req.param("inviteId");

    // Verify assessment belongs to tenant
    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const invitation = await db.query.assessmentInvitations.findFirst({
      where: and(
        eq(assessmentInvitations.id, inviteId),
        eq(assessmentInvitations.assessmentId, assessmentId)
      ),
    });

    if (!invitation) {
      throw new HTTPException(404, { message: "Invitation not found" });
    }

    if (invitation.status === "completed" || invitation.status === "declined") {
      throw new HTTPException(400, { message: "Cannot send reminder to completed or declined invitation" });
    }

    // Update reminder timestamp
    const [updated] = await db.update(assessmentInvitations)
      .set({ reminderSentAt: new Date(), updatedAt: new Date() })
      .where(eq(assessmentInvitations.id, inviteId))
      .returning();

    // TODO: Send reminder email

    return success(c, updated);
  }
);

// ============================================================================
// RESULTS
// ============================================================================

/**
 * GET /tenants/:tenantId/assessments/:assessmentId/results
 * Get aggregated results
 */
assessmentsRouter.get(
  "/:assessmentId/results",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const assessmentId = c.req.param("assessmentId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    // Check if results are released (or user is not the subject)
    if (assessment.subjectId === user.id && !assessment.resultsReleasedAt) {
      throw new HTTPException(403, { message: "Results have not been released yet" });
    }

    // Re-aggregate if needed (for active assessments)
    if (assessment.status === "active") {
      await aggregateResults(assessmentId);
    }

    const results = await db.query.assessmentResults.findMany({
      where: eq(assessmentResults.assessmentId, assessmentId),
      orderBy: (res, { asc }) => [asc(res.competencyName)],
    });

    return success(c, results);
  }
);

// ============================================================================
// GOAL SUGGESTIONS
// ============================================================================

/**
 * GET /tenants/:tenantId/assessments/:assessmentId/suggestions
 * Get goal suggestions
 */
assessmentsRouter.get(
  "/:assessmentId/suggestions",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const suggestions = await db.query.assessmentGoalSuggestions.findMany({
      where: eq(assessmentGoalSuggestions.assessmentId, assessmentId),
      orderBy: (sug, { desc }) => [desc(sug.createdAt)],
    });

    return success(c, suggestions);
  }
);

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/suggestions/:suggestionId/accept
 * Accept suggestion and create goal
 */
assessmentsRouter.post(
  "/:assessmentId/suggestions/:suggestionId/accept",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const assessmentId = c.req.param("assessmentId");
    const suggestionId = c.req.param("suggestionId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const suggestion = await db.query.assessmentGoalSuggestions.findFirst({
      where: and(
        eq(assessmentGoalSuggestions.id, suggestionId),
        eq(assessmentGoalSuggestions.assessmentId, assessmentId)
      ),
    });

    if (!suggestion) {
      throw new HTTPException(404, { message: "Suggestion not found" });
    }

    if (suggestion.status !== "pending") {
      throw new HTTPException(400, { message: "Suggestion has already been processed" });
    }

    // Create goal from suggestion
    const [goal] = await db.insert(goals).values({
      tenantId: tenantCtx.id,
      ownerId: assessment.subjectId,
      title: suggestion.suggestedGoal,
      description: suggestion.reason,
      type: "personal",
      status: "draft",
      aiSuggested: true,
      suggestionReason: `Based on ${suggestion.competencyName} assessment results`,
    }).returning();

    // Update suggestion
    const [updated] = await db.update(assessmentGoalSuggestions)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        createdGoalId: goal.id,
      })
      .where(eq(assessmentGoalSuggestions.id, suggestionId))
      .returning();

    return success(c, { suggestion: updated, goal });
  }
);

/**
 * POST /tenants/:tenantId/assessments/:assessmentId/suggestions/:suggestionId/dismiss
 * Dismiss suggestion
 */
assessmentsRouter.post(
  "/:assessmentId/suggestions/:suggestionId/dismiss",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const assessmentId = c.req.param("assessmentId");
    const suggestionId = c.req.param("suggestionId");

    const assessment = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantCtx.id)
      ),
    });

    if (!assessment) {
      throw new HTTPException(404, { message: "Assessment not found" });
    }

    const suggestion = await db.query.assessmentGoalSuggestions.findFirst({
      where: and(
        eq(assessmentGoalSuggestions.id, suggestionId),
        eq(assessmentGoalSuggestions.assessmentId, assessmentId)
      ),
    });

    if (!suggestion) {
      throw new HTTPException(404, { message: "Suggestion not found" });
    }

    if (suggestion.status !== "pending") {
      throw new HTTPException(400, { message: "Suggestion has already been processed" });
    }

    const [updated] = await db.update(assessmentGoalSuggestions)
      .set({ status: "dismissed", dismissedAt: new Date() })
      .where(eq(assessmentGoalSuggestions.id, suggestionId))
      .returning();

    return success(c, updated);
  }
);

export { assessmentsRouter };
