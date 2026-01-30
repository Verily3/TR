import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  db,
  eq,
  and,
  sql,
  assessmentTemplates,
  assessments,
  agencyMembers,
} from "@tr/db";
import { success, paginated, noContent } from "../lib/response";
import { listQuerySchema, uuidSchema } from "../lib/validation";
import { authMiddleware } from "../middleware";
import type { AppVariables } from "../types";

const templatesRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const agencyIdParamSchema = z.object({
  agencyId: uuidSchema,
});

const templateIdParamSchema = z.object({
  agencyId: uuidSchema,
  templateId: uuidSchema,
});

const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  scaleLabels: z.array(z.string()).optional(),
});

const competencySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema).default([]),
});

const goalRuleSchema = z.object({
  competencyId: z.string(),
  threshold: z.number(),
  operator: z.enum(["less_than", "less_than_equal", "equals", "greater_than"]),
  suggestedGoal: z.string(),
  suggestedProgram: z.string().uuid().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["180", "360", "self", "custom"]).default("360"),
  competencies: z.array(competencySchema).default([]),
  scaleMin: z.number().int().min(1).max(10).default(1),
  scaleMax: z.number().int().min(1).max(10).default(5),
  scaleLabels: z.array(z.string()).default(["Never", "Rarely", "Sometimes", "Often", "Always"]),
  goalSuggestionRules: z.array(goalRuleSchema).default([]),
  allowComments: z.boolean().default(true),
  requireComments: z.boolean().default(false),
  anonymizeResponses: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

const templateQuerySchema = listQuerySchema.extend({
  type: z.enum(["180", "360", "self", "custom", "all"]).default("all"),
  isActive: z.enum(["true", "false", "all"]).default("all"),
});

// ============================================================================
// HELPERS
// ============================================================================

async function requireAgencyAccess(
  userId: string,
  agencyId: string
): Promise<{ role: string }> {
  const membership = await db.query.agencyMembers.findFirst({
    where: and(
      eq(agencyMembers.agencyId, agencyId),
      eq(agencyMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new HTTPException(403, {
      message: "You do not have access to this agency",
    });
  }

  return { role: membership.role };
}

// ============================================================================
// LIST TEMPLATES
// ============================================================================

templatesRouter.get(
  "/",
  authMiddleware,
  zValidator("param", agencyIdParamSchema),
  zValidator("query", templateQuerySchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId } = c.req.valid("param");
    const query = c.req.valid("query");

    await requireAgencyAccess(user.id, agencyId);

    // Build conditions
    const conditions = [eq(assessmentTemplates.agencyId, agencyId)];

    if (query.type !== "all") {
      conditions.push(eq(assessmentTemplates.type, query.type));
    }

    if (query.isActive === "true") {
      conditions.push(eq(assessmentTemplates.isActive, true));
    } else if (query.isActive === "false") {
      conditions.push(eq(assessmentTemplates.isActive, false));
    }

    // Get templates
    const templates = await db.query.assessmentTemplates.findMany({
      where: and(...conditions),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assessmentTemplates)
      .where(and(...conditions));

    // Get usage stats for each template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        // Count assessments using this template
        const [{ assessmentCount }] = await db
          .select({ assessmentCount: sql<number>`count(*)` })
          .from(assessments)
          .where(eq(assessments.templateId, template.id));

        // Count completed assessments
        const [{ completedCount }] = await db
          .select({ completedCount: sql<number>`count(*)` })
          .from(assessments)
          .where(
            and(
              eq(assessments.templateId, template.id),
              eq(assessments.status, "closed")
            )
          );

        const competencies = (template.competencies as any[]) || [];
        const questionCount = competencies.reduce(
          (sum, c) => sum + (c.questions?.length || 0),
          0
        );

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          type: template.type,
          competencyCount: competencies.length,
          questionCount,
          scaleMin: template.scaleMin,
          scaleMax: template.scaleMax,
          isActive: template.isActive,
          usageCount: Number(assessmentCount),
          completionCount: Number(completedCount),
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };
      })
    );

    return paginated(c, templatesWithStats, {
      page: query.page,
      perPage: query.perPage,
      total: Number(count),
    });
  }
);

// ============================================================================
// GET TEMPLATE DETAIL
// ============================================================================

templatesRouter.get(
  "/:templateId",
  authMiddleware,
  zValidator("param", templateIdParamSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId, templateId } = c.req.valid("param");

    await requireAgencyAccess(user.id, agencyId);

    const template = await db.query.assessmentTemplates.findFirst({
      where: and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, agencyId)
      ),
    });

    if (!template) {
      throw new HTTPException(404, { message: "Template not found" });
    }

    // Get usage stats
    const [{ assessmentCount }] = await db
      .select({ assessmentCount: sql<number>`count(*)` })
      .from(assessments)
      .where(eq(assessments.templateId, template.id));

    const [{ completedCount }] = await db
      .select({ completedCount: sql<number>`count(*)` })
      .from(assessments)
      .where(
        and(
          eq(assessments.templateId, template.id),
          eq(assessments.status, "closed")
        )
      );

    return success(c, {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      competencies: template.competencies,
      scaleMin: template.scaleMin,
      scaleMax: template.scaleMax,
      scaleLabels: template.scaleLabels,
      goalSuggestionRules: template.goalSuggestionRules,
      allowComments: template.allowComments,
      requireComments: template.requireComments,
      anonymizeResponses: template.anonymizeResponses,
      isActive: template.isActive,
      usageCount: Number(assessmentCount),
      completionCount: Number(completedCount),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  }
);

// ============================================================================
// CREATE TEMPLATE
// ============================================================================

templatesRouter.post(
  "/",
  authMiddleware,
  zValidator("param", agencyIdParamSchema),
  zValidator("json", createTemplateSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId } = c.req.valid("param");
    const body = c.req.valid("json");

    const { role } = await requireAgencyAccess(user.id, agencyId);

    // Only admins and owners can create templates
    if (!["owner", "admin"].includes(role)) {
      throw new HTTPException(403, {
        message: "Only agency admins can create templates",
      });
    }

    const [template] = await db
      .insert(assessmentTemplates)
      .values({
        agencyId,
        name: body.name,
        description: body.description,
        type: body.type,
        competencies: body.competencies,
        scaleMin: body.scaleMin,
        scaleMax: body.scaleMax,
        scaleLabels: body.scaleLabels,
        goalSuggestionRules: body.goalSuggestionRules,
        allowComments: body.allowComments,
        requireComments: body.requireComments,
        anonymizeResponses: body.anonymizeResponses,
      })
      .returning();

    return success(
      c,
      {
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        competencies: template.competencies,
        scaleMin: template.scaleMin,
        scaleMax: template.scaleMax,
        scaleLabels: template.scaleLabels,
        isActive: template.isActive,
        createdAt: template.createdAt,
      },
      201
    );
  }
);

// ============================================================================
// UPDATE TEMPLATE
// ============================================================================

templatesRouter.patch(
  "/:templateId",
  authMiddleware,
  zValidator("param", templateIdParamSchema),
  zValidator("json", updateTemplateSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId, templateId } = c.req.valid("param");
    const body = c.req.valid("json");

    const { role } = await requireAgencyAccess(user.id, agencyId);

    if (!["owner", "admin"].includes(role)) {
      throw new HTTPException(403, {
        message: "Only agency admins can update templates",
      });
    }

    // Check template exists
    const existing = await db.query.assessmentTemplates.findFirst({
      where: and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, agencyId)
      ),
    });

    if (!existing) {
      throw new HTTPException(404, { message: "Template not found" });
    }

    const [template] = await db
      .update(assessmentTemplates)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(assessmentTemplates.id, templateId))
      .returning();

    return success(c, {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      competencies: template.competencies,
      scaleMin: template.scaleMin,
      scaleMax: template.scaleMax,
      scaleLabels: template.scaleLabels,
      goalSuggestionRules: template.goalSuggestionRules,
      allowComments: template.allowComments,
      requireComments: template.requireComments,
      anonymizeResponses: template.anonymizeResponses,
      isActive: template.isActive,
      updatedAt: template.updatedAt,
    });
  }
);

// ============================================================================
// DELETE (ARCHIVE) TEMPLATE
// ============================================================================

templatesRouter.delete(
  "/:templateId",
  authMiddleware,
  zValidator("param", templateIdParamSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId, templateId } = c.req.valid("param");

    const { role } = await requireAgencyAccess(user.id, agencyId);

    if (!["owner", "admin"].includes(role)) {
      throw new HTTPException(403, {
        message: "Only agency admins can delete templates",
      });
    }

    // Check template exists
    const existing = await db.query.assessmentTemplates.findFirst({
      where: and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, agencyId)
      ),
    });

    if (!existing) {
      throw new HTTPException(404, { message: "Template not found" });
    }

    // Soft delete by setting isActive to false
    await db
      .update(assessmentTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(assessmentTemplates.id, templateId));

    return noContent(c);
  }
);

// ============================================================================
// DUPLICATE TEMPLATE
// ============================================================================

templatesRouter.post(
  "/:templateId/duplicate",
  authMiddleware,
  zValidator("param", templateIdParamSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId, templateId } = c.req.valid("param");

    const { role } = await requireAgencyAccess(user.id, agencyId);

    if (!["owner", "admin"].includes(role)) {
      throw new HTTPException(403, {
        message: "Only agency admins can duplicate templates",
      });
    }

    // Get original template
    const original = await db.query.assessmentTemplates.findFirst({
      where: and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, agencyId)
      ),
    });

    if (!original) {
      throw new HTTPException(404, { message: "Template not found" });
    }

    // Create duplicate with "(Copy)" suffix
    const [duplicate] = await db
      .insert(assessmentTemplates)
      .values({
        agencyId,
        name: `${original.name} (Copy)`,
        description: original.description,
        type: original.type,
        competencies: original.competencies,
        scaleMin: original.scaleMin,
        scaleMax: original.scaleMax,
        scaleLabels: original.scaleLabels,
        goalSuggestionRules: original.goalSuggestionRules,
        allowComments: original.allowComments,
        requireComments: original.requireComments,
        anonymizeResponses: original.anonymizeResponses,
      })
      .returning();

    return success(
      c,
      {
        id: duplicate.id,
        name: duplicate.name,
        description: duplicate.description,
        type: duplicate.type,
        createdAt: duplicate.createdAt,
      },
      201
    );
  }
);

// ============================================================================
// GET TEMPLATE STATS
// ============================================================================

templatesRouter.get(
  "/:templateId/stats",
  authMiddleware,
  zValidator("param", templateIdParamSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId, templateId } = c.req.valid("param");

    await requireAgencyAccess(user.id, agencyId);

    // Check template exists
    const template = await db.query.assessmentTemplates.findFirst({
      where: and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, agencyId)
      ),
    });

    if (!template) {
      throw new HTTPException(404, { message: "Template not found" });
    }

    // Get assessment counts by status
    const statusCounts = await db
      .select({
        status: assessments.status,
        count: sql<number>`count(*)`,
      })
      .from(assessments)
      .where(eq(assessments.templateId, templateId))
      .groupBy(assessments.status);

    const stats = {
      draft: 0,
      active: 0,
      closed: 0,
      archived: 0,
    };

    statusCounts.forEach((row) => {
      stats[row.status as keyof typeof stats] = Number(row.count);
    });

    const totalAssessments = Object.values(stats).reduce((a, b) => a + b, 0);

    // Get tenant count (unique tenants using this template)
    const [{ tenantCount }] = await db
      .select({ tenantCount: sql<number>`count(distinct ${assessments.tenantId})` })
      .from(assessments)
      .where(eq(assessments.templateId, templateId));

    return success(c, {
      totalAssessments,
      byStatus: stats,
      tenantCount: Number(tenantCount),
    });
  }
);

export { templatesRouter };
