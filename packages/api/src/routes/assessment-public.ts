import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  db,
  eq,
  and,
  assessments,
  assessmentTemplates,
  assessmentInvitations,
  assessmentResponses,
  users,
} from "@tr/db";
import { success } from "../lib/response";
import type { AppVariables } from "../types";

const assessmentPublicRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const submitResponsesSchema = z.object({
  responses: z.array(z.object({
    competencyId: z.string(),
    questionId: z.string(),
    score: z.number().int().min(1).max(10),
    comment: z.string().optional(),
  })).min(1),
});

const declineSchema = z.object({
  reason: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getInvitationByToken(token: string) {
  const invitation = await db.query.assessmentInvitations.findFirst({
    where: eq(assessmentInvitations.token, token),
    with: {
      assessment: {
        with: {
          template: true,
          subject: {
            columns: { id: true, firstName: true, lastName: true },
          },
        },
      },
      responses: true,
    },
  });

  return invitation;
}

// ============================================================================
// PUBLIC ROUTES (No auth required)
// ============================================================================

/**
 * GET /assessments/respond/:token
 * Get assessment form for rater
 */
assessmentPublicRouter.get(
  "/:token",
  async (c) => {
    const token = c.req.param("token");

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      throw new HTTPException(404, { message: "Invalid or expired invitation" });
    }

    if (invitation.status === "completed") {
      return success(c, {
        status: "completed",
        message: "You have already completed this assessment. Thank you for your feedback!",
      });
    }

    if (invitation.status === "declined") {
      return success(c, {
        status: "declined",
        message: "You have declined this assessment invitation.",
      });
    }

    if (invitation.status === "expired") {
      throw new HTTPException(410, { message: "This invitation has expired" });
    }

    const assessment = invitation.assessment;

    if (assessment.status !== "active") {
      throw new HTTPException(400, { message: "This assessment is not currently active" });
    }

    // Check if past end date
    if (assessment.endDate && new Date(assessment.endDate) < new Date()) {
      // Mark as expired
      await db.update(assessmentInvitations)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(assessmentInvitations.id, invitation.id));

      throw new HTTPException(410, { message: "This invitation has expired" });
    }

    const template = assessment.template;
    if (!template) {
      throw new HTTPException(500, { message: "Assessment template not found" });
    }

    // Get subject name
    const subjectName = assessment.subject
      ? [assessment.subject.firstName, assessment.subject.lastName].filter(Boolean).join(" ") || "the subject"
      : "the subject";

    // Mark as started if pending
    if (invitation.status === "pending") {
      await db.update(assessmentInvitations)
        .set({ status: "started", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(assessmentInvitations.id, invitation.id));
    }

    return success(c, {
      invitation: {
        id: invitation.id,
        raterType: invitation.raterType,
        raterName: invitation.raterName,
        status: invitation.status === "pending" ? "started" : invitation.status,
      },
      assessment: {
        name: assessment.name,
        description: assessment.description,
        subjectName,
        anonymized: assessment.anonymizeResponses,
        endDate: assessment.endDate,
      },
      template: {
        competencies: template.competencies,
        scaleMin: template.scaleMin,
        scaleMax: template.scaleMax,
        scaleLabels: template.scaleLabels,
        allowComments: template.allowComments,
        requireComments: template.requireComments,
      },
      existingResponses: invitation.responses.map(r => ({
        competencyId: r.competencyId,
        questionId: r.questionId,
        score: r.score,
        comment: r.comment,
      })),
    });
  }
);

/**
 * POST /assessments/respond/:token
 * Submit responses
 */
assessmentPublicRouter.post(
  "/:token",
  zValidator("json", submitResponsesSchema),
  async (c) => {
    const token = c.req.param("token");
    const data = c.req.valid("json");

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      throw new HTTPException(404, { message: "Invalid or expired invitation" });
    }

    if (invitation.status === "completed") {
      throw new HTTPException(400, { message: "You have already completed this assessment" });
    }

    if (invitation.status === "declined") {
      throw new HTTPException(400, { message: "You have declined this assessment" });
    }

    if (invitation.status === "expired") {
      throw new HTTPException(410, { message: "This invitation has expired" });
    }

    const assessment = invitation.assessment;

    if (assessment.status !== "active") {
      throw new HTTPException(400, { message: "This assessment is not currently active" });
    }

    // Delete existing responses and insert new ones
    await db.delete(assessmentResponses)
      .where(eq(assessmentResponses.invitationId, invitation.id));

    const responses = data.responses.map(r => ({
      invitationId: invitation.id,
      competencyId: r.competencyId,
      questionId: r.questionId,
      score: r.score,
      comment: r.comment || null,
    }));

    await db.insert(assessmentResponses).values(responses);

    // Check if all questions are answered
    const template = assessment.template;
    let totalQuestions = 0;
    if (template && template.competencies) {
      for (const comp of template.competencies as any[]) {
        totalQuestions += (comp.questions?.length || 0);
      }
    }

    const isComplete = data.responses.length >= totalQuestions;

    if (isComplete) {
      // Mark invitation as completed
      await db.update(assessmentInvitations)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(assessmentInvitations.id, invitation.id));

      // Update assessment completed count
      await db.update(assessments)
        .set({
          completedResponses: (assessment.completedResponses || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(assessments.id, assessment.id));

      return success(c, {
        status: "completed",
        message: "Thank you! Your responses have been submitted successfully.",
      });
    } else {
      // Save progress
      return success(c, {
        status: "in_progress",
        message: "Your progress has been saved. You can continue later.",
        answeredCount: data.responses.length,
        totalCount: totalQuestions,
      });
    }
  }
);

/**
 * POST /assessments/respond/:token/decline
 * Decline invitation
 */
assessmentPublicRouter.post(
  "/:token/decline",
  zValidator("json", declineSchema),
  async (c) => {
    const token = c.req.param("token");
    const data = c.req.valid("json");

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      throw new HTTPException(404, { message: "Invalid or expired invitation" });
    }

    if (invitation.status === "completed") {
      throw new HTTPException(400, { message: "You have already completed this assessment" });
    }

    if (invitation.status === "declined") {
      throw new HTTPException(400, { message: "You have already declined this assessment" });
    }

    // Mark as declined
    await db.update(assessmentInvitations)
      .set({
        status: "declined",
        declinedAt: new Date(),
        declineReason: data.reason || null,
        updatedAt: new Date()
      })
      .where(eq(assessmentInvitations.id, invitation.id));

    return success(c, {
      status: "declined",
      message: "You have declined this assessment invitation.",
    });
  }
);

/**
 * GET /assessments/respond/:token/status
 * Check invitation status
 */
assessmentPublicRouter.get(
  "/:token/status",
  async (c) => {
    const token = c.req.param("token");

    const invitation = await db.query.assessmentInvitations.findFirst({
      where: eq(assessmentInvitations.token, token),
      with: {
        assessment: {
          columns: { name: true, status: true, endDate: true },
        },
      },
    });

    if (!invitation) {
      throw new HTTPException(404, { message: "Invalid invitation" });
    }

    return success(c, {
      status: invitation.status,
      assessmentName: invitation.assessment.name,
      assessmentStatus: invitation.assessment.status,
      endDate: invitation.assessment.endDate,
    });
  }
);

export { assessmentPublicRouter };
