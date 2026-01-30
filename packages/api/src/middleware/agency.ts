import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db, eq, and, agencies, agencyMembers } from "@tr/db";
import type { AppVariables, AgencyContext } from "../types";

/**
 * Agency middleware - resolves agency from header or path param
 * Verifies user has access to the agency
 */
export const agencyMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    // Get agency ID from header or path parameter
    const agencyId =
      c.req.header("X-Agency-ID") || c.req.param("agencyId");

    if (!agencyId) {
      throw new HTTPException(400, {
        message: "Agency ID is required",
      });
    }

    // Fetch agency and verify user membership
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, agencyId),
    });

    if (!agency) {
      throw new HTTPException(404, {
        message: "Agency not found",
      });
    }

    if (!agency.isActive) {
      throw new HTTPException(403, {
        message: "Agency account is deactivated",
      });
    }

    // Check user membership
    const membership = await db.query.agencyMembers.findFirst({
      where: and(
        eq(agencyMembers.agencyId, agencyId),
        eq(agencyMembers.userId, user.id)
      ),
    });

    if (!membership) {
      throw new HTTPException(403, {
        message: "You do not have access to this agency",
      });
    }

    if (!membership.isActive) {
      throw new HTTPException(403, {
        message: "Your membership in this agency is deactivated",
      });
    }

    const agencyContext: AgencyContext = {
      id: agency.id,
      name: agency.name,
      role: membership.role as "owner" | "admin" | "member",
    };

    c.set("agency", agencyContext);

    await next();
  }
);

/**
 * Require owner or admin role within agency
 */
export const requireAgencyAdmin = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const agency = c.get("agency");

    if (!agency) {
      throw new HTTPException(500, {
        message: "Agency context not set",
      });
    }

    if (agency.role !== "owner" && agency.role !== "admin") {
      throw new HTTPException(403, {
        message: "Agency admin access required",
      });
    }

    await next();
  }
);

/**
 * Require owner role within agency
 */
export const requireAgencyOwner = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const agency = c.get("agency");

    if (!agency) {
      throw new HTTPException(500, {
        message: "Agency context not set",
      });
    }

    if (agency.role !== "owner") {
      throw new HTTPException(403, {
        message: "Agency owner access required",
      });
    }

    await next();
  }
);
